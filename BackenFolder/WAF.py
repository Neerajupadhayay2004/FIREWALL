import asyncio
from aiohttp import web, ClientSession
import ssl, re, logging, os, time, json, hashlib, ipaddress
from collections import defaultdict, deque
import concurrent.futures
from dataclasses import dataclass, field
from typing import Dict, List, Set, Tuple, Optional
import statistics
import math

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("waf.log"),
        logging.StreamHandler()
    ]
)

# Configuration
CONFIG_FILE = "waf_config.json"

# Default configuration
DEFAULT_CONFIG = {
    'domains': {
        'ronak.cloud': {
            'target': 'http://localhost:8001',
            'cert': 'C:/Users/Administrator/Desktop/Term/cer.crt',
            'key': 'C:/Users/Administrator/Desktop/Term/pri.key'
        },
        'example.com': {
            'target': 'http://localhost:8002',
            'cert': 'C:/Users/Administrator/Desktop/Term/cer.crt',
            'key': 'C:/Users/Administrator/Desktop/Term/pri.key'
        }
    },
    'rate_limits': {
        'window_size': 10,         # seconds
        'max_requests': 20,        # max requests per window
        'burst_window': 2,         # seconds for burst detection
        'burst_threshold': 10,     # requests in burst window
        'ip_block_duration': 1800, # seconds (30 minutes)
        'max_payload_size': 1048576 # 1MB
    },
    'behavioral_analysis': {
        'suspicious_user_agents': [
            'zgrab', 'masscan', 'nmap', 'nikto', 'sqlmap', 
            'whatweb', 'dirbuster', 'wpscan', 'joomscan'
        ],
        'session_tracking_window': 300, # 5 minutes
        'error_threshold': 5,      # 5 errors in window is suspicious
        'path_diversity_threshold': 20  # 20 different paths in window is suspicious
    },
    'whitelist': {
        'ips': [],
        'paths': ['/health', '/status']
    },
    'blacklist': {
        'ips': [],
        'countries': [],
        'asns': []
    },
    'attack_detection': {
        'min_score': 2,           # Minimum score to consider an attack
        'context_aware': True     # Use context-aware detection
    }
}

# Load configuration from file or use defaults
def load_config():
    try:
        if os.path.exists(CONFIG_FILE):
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                logging.info(f"Loaded configuration from {CONFIG_FILE}")
                return config
        else:
            # Save default config to file
            with open(CONFIG_FILE, 'w') as f:
                json.dump(DEFAULT_CONFIG, f, indent=4)
            logging.info(f"Created default configuration file {CONFIG_FILE}")
            return DEFAULT_CONFIG
    except Exception as e:
        logging.error(f"Error loading configuration: {e}")
        return DEFAULT_CONFIG

CONFIG = load_config()
DOMAIN_CONFIGS = CONFIG['domains']
RATE_LIMITS = CONFIG['rate_limits']
BEHAVIORAL = CONFIG['behavioral_analysis']
WHITELIST = CONFIG['whitelist']
BLACKLIST = CONFIG['blacklist']
ATTACK_DETECTION = CONFIG.get('attack_detection', DEFAULT_CONFIG['attack_detection'])

@dataclass
class ClientStats:
    requests: List[float] = field(default_factory=list)
    paths: Set[str] = field(default_factory=set)
    errors: int = 0
    payload_sizes: List[int] = field(default_factory=list)
    user_agents: Set[str] = field(default_factory=set)
    methods: Dict[str, int] = field(default_factory=lambda: defaultdict(int))
    last_seen: float = field(default_factory=time.time)
    blocked_until: float = 0
    recent_attacks: Dict[str, int] = field(default_factory=lambda: defaultdict(int))

# Security state
blocked_ips = {}  # IP -> timestamp until blocked
ip_stats = defaultdict(ClientStats)  # Track client behavior

# Global traffic patterns for anomaly detection
traffic_history = deque(maxlen=60)  # Last 60 seconds of request counts
baseline_requests_per_second = 0
traffic_anomaly_threshold = 2.0  # 2x baseline is anomalous

# Improved attack patterns with better context awareness and reduced false positives
attack_patterns = {
    # XSS Patterns - Improved to reduce false positives
    'xss': [
        # Using word boundaries to avoid matching legitimate substrings
        r"<script\b.*?>.*?</script\b.*?>",
        # More specific JS event handlers
        r"\bon(?:error|load|click|submit|mouse(?:over|out))\s*=",
        # Focus on actual JS execution contexts
        r"\beval\s*\([^)]*\)|setTimeout\s*\([^)]*\)",
        # Avoid common false positives in URLs by being more specific
        r"\bdocument\.(?:cookie|location|write)\b",
        # More specific tag patterns
        r"<(?:img|iframe|svg)\b[^>]*\bon[a-z]+\s*=",
        # Dialog functions with execution context
        r"\b(?:alert|confirm|prompt)\s*\([^)]*\)",
        # Looking for encoded content in suspicious contexts only
        r"(?:<[^>]*>.*?)(?:&#x[0-9a-f]{2};|&#\d+;|%[0-9a-f]{2})(?:.*?</[^>]*>)",
    ],
    
    # SQL Injection Patterns - More precise patterns to reduce false positives
    'sqli': [
        # Union-based SQL injection with context
        r"(?:\bunion\b\s+(?:\ball\b\s+)?\bselect\b)",
        # Data modification statements in query context
        r"(?:\binsert\b\s+\binto\b|\bupdate\b\s+.+\s+\bset\b|\bdelete\b\s+\bfrom\b)",
        # Schema modification with context
        r"(?:\bdrop\b\s+(?:\btable\b|\bdatabase\b)|\btruncate\b\s+\btable\b)",
        # SQL comments following semicolon
        r";\s*(?:--|#|\/\*)",
        # Stored procedures with precision
        r"\bxp_cmdshell\b|\bexec\b\s+\bmaster\b|\bdbms_\w+",
        # Time-based blind SQL injection
        r"\bbenchmark\s*\(\s*\d+\s*,",
        r"\bsleep\s*\(\s*\d+\s*\)",
        r"\bwaitfor\s+\bdelay\b",
        # Boolean-based SQL injection with context
        r"\b(?:or|and)\b\s+\d+=\d+\b",
        r"\b(?:or|and)\b\s+\'[^']*\'=\'[^']*\'",
        r"\b(?:or|and)\b\s+[\"'][^\"']*[\"']=[\"'][^\"']*[\"']",
    ],
    
    # Path Traversal and LFI/RFI - More precise
    'path_traversal': [
        r"(?:\.\./|\.\.\%2f|\.\\\.|\.\.\\)",
        # Focus on specific sensitive files
        r"(?:/etc/(?:passwd|shadow)|/proc/self/environ)\b",
        r"(?:c:\\windows\\system32\\|boot\.ini\b|win\.ini\b)",
        # Dangerous URL schemes in request parameters
        r"\b(?:file|php|data|zlib|phar|zip)://",
        r"\b(?:expect|ssh2|ogg|rar)://",
        # Remote includes with protocol
        r"[?&][^=]*=(?:ftp|https?)://(?:[^\s/]+\.)+[^\s/]+/.*?",
    ],
    
    # Command Injection - More precise
    'command_injection': [
        # Command separators followed by commands
        r"(?:;|&&|\|\||\||\`)\s*(?:wget|curl|nc|bash|sh|powershell)\b",
        r"(?:;|&&|\|\||\||\`)\s*(?:cat|tail|more|less|head)\b",
        r"(?:;|&&|\|\||\||\`)\s*(?:ls|dir|cd|pwd|echo)\b",
        # PHP functions that execute commands
        r"\b(?:system|exec|shell_exec|passthru|proc_open)\s*\(",
        r"\b(?:popen|pcntl_exec|eval|assert)\s*\(",
        # Network commands
        r"(?:;|&&|\|\||\||\`)\s*(?:ping|nslookup|dig|traceroute)\b",
    ],
    
    # CSRF Patterns - More contextual
    'csrf': [
        # Forms in request parameters
        r"<form\b.*?>.*?</form>",
        # Image tags with event handlers
        r"<img\b.*?src=[^>]*\bonerror\b=[^>]*>",
    ],
    
    # Server-Side Template Injection - More precise
    'ssti': [
        # Template expressions in request parameters
        r"[?&][^=]*=.*?\{\{.*?\}\}",
        r"[?&][^=]*=.*?\{\%.*?\%\}",
        r"[?&][^=]*=.*?\$\{.*?\}",
        r"[?&][^=]*=.*?<#.*?#>",
        r"[?&][^=]*=.*?<%.*?%>",
    ],
    
    # XML External Entity (XXE) - More precise
    'xxe': [
        # DOCTYPE declarations with SYSTEM
        r"<!DOCTYPE[^>]*SYSTEM[^>]*>",
        # ENTITY declarations with SYSTEM or PUBLIC
        r"<!ENTITY[^>]*(?:SYSTEM|PUBLIC)[^>]*>",
    ],
    
    # Object Injection - More precise
    'object_injection': [
        # PHP serialized objects in parameters
        r"[?&][^=]*=.*?O:[0-9]+:\"[^\"]+\":[0-9]+:\{",
        # Base64 serialized objects in parameters
        r"[?&][^=]*=.*?rO0[A-Za-z0-9+/=]+",
    ],
    
    # HTTP Request Smuggling - More precise
    'request_smuggling': [
        # Conflicting headers
        r"(?:^|\n)Transfer-Encoding:.*?chunked.*?(?:\r?\n).*?Content-Length:",
        r"(?:^|\n)Content-Length:.*?(?:\r?\n).*?Transfer-Encoding:.*?chunked",
    ],
    
    # Web Shell Signatures - More precise
    'web_shell': [
        # PHP execution functions with user input
        r"\b(?:eval|system|exec|shell_exec)\s*\(\s*\$_(?:GET|POST|REQUEST|COOKIE)",
        r"\b(?:passthru|proc_open|popen)\s*\(\s*\$_(?:GET|POST|REQUEST|COOKIE)",
        # File upload handling
        r"\bmove_uploaded_file\s*\(\s*\$_FILES",
    ],
    
    # JWT Attacks - More precise
    'jwt_attacks': [
        # Suspicious JWT modifications
        r"eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+.*?\"alg\":\"none\"",
    ],
    
    # Log4j/Log4Shell - More precise
    'log4j': [
        # JNDI lookups
        r"\$\{jndi:(?:ldap|rmi|dns|iiop)://",
        # Other Log4j RCE patterns
        r"\$\{(?:lower|upper|base64|env):",
    ],

    'xss': [
        r"<script[^>]*>.*?</script>",
        r"javascript:.*?\(.*?\)",
        r"on\w+\s*=.*?[\"'].*?[\"']",
        r"<img[^>]*src[^>]*=.*?onerror.*?>",
        r"document\.cookie",
        r"document\.location",
        r"alert\s*\(.*?\)",
        r"prompt\s*\(.*?\)",
        r"eval\s*\(.*?\)",
        r"<iframe.*?>",
        r"\b(localStorage|sessionStorage)\b",
        r"location\.(href|hash|pathname|search)",
        r"fetch\s*\(.*?\)",
        r"XMLHttpRequest\s*\(",
        r"new\s+Function\s*\(",
        r"\bdom\s*xss\b",
        r"fromCharCode\s*\(.*?\)",
        r"&#\d+;",
        r"\\u[0-9a-fA-F]{4}",
        r"<svg[^>]*>.*?<\/svg>"
    ],
    'sqli': [
        r"\bselect\b.+\bfrom\b",
        r"\bunion\b.+\bselect\b",
        r"\binsert\b.+\binto\b",
        r"\bupdate\b.+\bset\b",
        r"\bdelete\b.+\bfrom\b",
        r"\bdrop\b.+\btable\b",
        r"\bdrop\b.+\bdatabase\b",
        r"\btruncate\b.+\btable\b",
        r"\balter\b.+\btable\b",
        r"\bexec\b.+\bsp_\b",
        r"\bxp_cmdshell\b",
        r"\b--\b",
        r"\b#\b",
        r"/\*.*?\*/",
        r";\s*$",
        r"\b1\s*=\s*1\b",
        r"'\s*or\s*'\s*=\s*'",
        r"'\s*or\s*1\s*=\s*1\s*--\s*",
        r"'\s*or\s*1\s*=\s*1\s*#\s*",
        r"\bwaitfor\s+delay\b",
        r"\bsleep\s*\(\s*\d+\s*\)",
        r"\bpg_sleep\s*\(\s*\d+\s*\)",
        r"\bor\s+\d+\s*=\s*\d+",
        r"\band\s+\d+\s*=\s*\d+",
        r"\bbenchmark\s*\(.*\,.*\)",
        r"\blike\s*[\"']\s*%"
    ],
    'path_traversal': [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e%2f",
        r"%2e%2e/",
        r"%2e%2e%5c",
        r"%252e%252e%255c",
        r"%252e%252e%252f",
        r"\.\.%2f",
        r"\.\.%5c",
        r"\.\.%c0%af",
        r"\.\.%c1%9c",
        r"/etc/passwd",
        r"C:\\Windows\\win.ini",
        r"/var/www/",
        r"/proc/self/environ",
        r"/windows/system32/",
        r"/boot/grub/grub.conf"
    ],
    'command_injection': [
        r"\|.*?\b(?:ls|dir|cat|echo|rm|pwd|mv|cp|chmod|chown|wget|curl|nc|net|ping|telnet|nslookup|ssh|sudo)\b",
        r"\;.*?\b(?:ls|dir|cat|echo|rm|pwd|mv|cp|chmod|chown|wget|curl|nc|net|ping|telnet|nslookup|ssh|sudo)\b",
        r"\$\(",
        r"\`.*?\`",
        r"\&\&.*?\b(?:ls|dir|cat|echo|rm|pwd|mv|cp|chmod|chown|wget|curl|nc|net|ping|telnet|nslookup|ssh|sudo)\b",
        r"\|\|.*?\b(?:ls|dir|cat|echo|rm|pwd|mv|cp|chmod|chown|wget|curl|nc|net|ping|telnet|nslookup|ssh|sudo)\b",
        r"\$\{.*?\}",
        r"\\n.*?\b(?:ls|dir|cat|echo|rm|pwd|mv|cp|chmod|chown|wget|curl|nc|net|ping|telnet|nslookup|ssh|sudo)\b",
        r"\b(?:bash|sh|ksh|csh|dash|zsh)\b\s+-c",
        r"\bpython\b.*?\bimport\b.*?\bos\b",
        r"\bperl\b.*?\bsystem\b",
        r"\bruby\b.*?\bsystem\b",
        r"\bnode\b.*?\bchild_process\b",
        r"\bphp\b.*?\bexec\b",
        r"\bcmd\b.*?\/c"
    ],
    'file_inclusion': [
        r"(?:f|ht)tps?:\/\/\S+",
        r"php:\/\/filter\/",
        r"php:\/\/input",
        r"phar:\/\/",
        r"zip:\/\/",
        r"data:\/\/",
        r"expect:\/\/",
        r"file:\/\/\/",
        r"gopher:\/\/",
        r"jar:\/\/",
        r"netdoc:\/\/",
        r"dict:\/\/",
        r"ldap:\/\/",
        r"include\s*\(.*?\)",
        r"require\s*\(.*?\)",
        r"include_once\s*\(.*?\)",
        r"require_once\s*\(.*?\)"
    ],
    'code_injection': [
        r"eval\s*\(.*?\)",
        r"setTimeout\s*\(.*?\)",
        r"setInterval\s*\(.*?\)",
        r"Function\s*\(.*?\)",
        r"fromCharCode\s*\(.*?\)",
        r"innerHTML\s*=",
        r"document\.write\s*\(.*?\)",
        r"document\.writeln\s*\(.*?\)",
        r"document\.createElement\s*\(.*?\)",
        r"document\.execCommand\s*\(.*?\)",
        r"window\.execScript\s*\(.*?\)",
        r"window\.setImmediate\s*\(.*?\)",
        r"window\.setTimeout\s*\(.*?\)",
        r"window\.setInterval\s*\(.*?\)",
        r"window\.Function\s*\(.*?\)",
        r"new\s+Function\s*\(.*?\)",
        r"new\s+worker\s*\(.*?\)",
        r"DOMParser\s*\(.*?\)",
        r"\.innerHTML\s*=",
        r"\.outerHTML\s*=",
        r"\.insertAdjacentHTML\s*\(.*?\)"
    ],
    'protocol_attacks': [
        r"HTTP/1\.\d\s+[45]\d\d",
        r"Content-Length:\s*-?\d+",
        r"Transfer-Encoding:\s*chunked",
        r"Connection:\s*keep-alive,\s*upgrade",
        r"Upgrade:\s*\w+",
        r"Proxy-Connection:",
        r"HTTP/1\.1\r\n\r\nHTTP/1\.1",
        r"Host:\s*\S+\.\S+\r\nHost:\s*\S+\.\S+",
        r"Content-Length:\s*\d+\r\nContent-Length:\s*\d+",
        r"Content-Type:\s*\w+/\w+\r\nContent-Type:\s*\w+/\w+"
    ],
    'insecure_deserialization': [
        r"O:\d+:\"[^\"]+\":",
        r"rO0AB",
        r"serialized:",
        r"marshalled:",
        r"ACED0005",
        r"base64:",
        r"S:"
    ],
    'csrf': [
        r"http-equiv=\"refresh\"",
        r"<form\s+.*?(?:action|method)",
        r"<meta\s+.*?url="
    ],
    'open_redirect': [
        r"url=https?:\/\/",
        r"redirect=https?:\/\/",
        r"return=https?:\/\/",
        r"next=https?:\/\/",
        r"to=https?:\/\/",
        r"link=https?:\/\/",
        r"goto=https?:\/\/",
        r"target=https?:\/\/",
        r"destination=https?:\/\/",
        r"redir=https?:\/\/",
        r"redirect_uri=https?:\/\/",
        r"redirect_url=https?:\/\/",
        r"callback=https?:\/\/",
        r"return_path=https?:\/\/",
        r"returnUrl=https?:\/\/"
    ],
    'dos': [
        r"(\.\*){5,}",
        r"([a-zA-Z0-9]){100,}",
        r"([^\w\s]){50,}",
        r"(\([\w\s\*\+\.\?\{\}]*){5,}",
        r"(\$\{.+?\}){5,}"
    ],
    'jwt': [
        r"eyJ[a-zA-Z0-9\-_]+\.eyJ[a-zA-Z0-9\-_]+\.[a-zA-Z0-9\-_]+",
        r"alg.+none"
    ],
    'ssti': [
        r"\$\{.*?\}",
        r"\{\{.*?\}\}",
        r"\{%.*?%\}",
        r"\#\{.*?\}",
        r"\$\[.*?\]",
        r"<\?.*?\?>",
        r"<\%.*?\%>",
        r"\${.*?}",
        r"\$util.*?evaluate",
        r"<%.*?%>",
        r"#\{.*?\}",
        r"\{\{.*?\|.*?\}\}"
    ],
    'ssrf': [
        r"localhost",
        r"127\.0\.0\.1",
        r"0\.0\.0\.0",
        r"::1",
        r"[:\.]+127\.0\.0\.1",
        r"[:\.]+localhost",
        r"[:\.]+0\.0\.0\.0",
        r"internal\.",
        r"intranet\.",
        r"192\.168\.",
        r"10\.",
        r"172\.(1[6-9]|2[0-9]|3[0-1])\.",
        r"file:\/\/",
        r"dict:\/\/",
        r"gopher:\/\/",
        r"tftp:\/\/",
        r"ldap:\/\/",
        r"netdoc:\/\/"
    ],
    'xxe': [
        r"<!DOCTYPE[^>]*SYSTEM[^>]*>",
        r"<!ENTITY[^>]*(?:SYSTEM|PUBLIC)[^>]*>"
    ],

##############################################################################################################################
    'xss': [
        r"<script.*?>.*?</script.*?>",
        r"javascript:|on\w+\s*=",
        r"alert\s*\(|confirm\s*\(|prompt\s*\(",
        r"<iframe.*?src=",
        r"document\.cookie|document\.location|window\.location",
    ],
    'sqli': [
        r"union\s+select|select\s+\*\s+from",
        r"insert\s+into|drop\s+table|update\s+.+\s+set\s+",
        r";--|--|#|/\*.*?\*/",
        r"'\s*or\s*'1'\s*=\s*'1",
        r"waitfor\s+delay|sleep\s*\(\s*\d+\s*\)|benchmark\s*\(",
    ],
    'path_traversal': [
        r"\.\./|\.\.\\|\.\.\%2f|\.\.\%5c",
        r"/etc/passwd|/etc/shadow|boot\.ini|win\.ini",
        r"c:\\windows\\system32|/bin/bash|/usr/bin/",
    ],
    'command_injection': [
        r"wget\s|curl\s|powershell|nc\s|-e\s",
        r"\|\s*\w+|`.*?`|\$\(.*?\)",
        r"system\s*\(|exec\s*\(|passthru\s*\(|shell_exec\s*\(",
    ],
    'ssrf_lfi_rfi': [
        r"file:\/\/|php:\/\/|data:\/\/|gopher:\/\/|dict:\/\/",
        r"localhost|127\.0\.0\.1|0\.0\.0\.0|::1",
        r"file_get_contents\s*\(|include\s*\(|require\s*\(",
        r"https?:%2f%2f|https?:%252f%252f",
    ],
    'rce': [
        r"eval\s*\(|assert\s*\(|unserialize\s*\(",
        r"base64_decode\s*\(|str_rot13\s*\(|gzinflate\s*\(",
        r"preg_replace\s*\(.*/e",
    ],
    'file_upload': [
        r"\.php\d*$|\.phtml$|\.phar$|\.htaccess$",
        r"<%.*?%>|<\?php",
    ],
    'xxe': [
        r"<!DOCTYPE.*?\[.*?<!ENTITY",
        r"<!ENTITY.*?SYSTEM",
    ],
    'csrf': [
        r"<form.*?>.*?</form>",
    ],
    'jwt': [
        r"eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*",
        r"none|null",
    ],
    'ssti': [
        r"\{\{.*?\}\}|\{\%.*?\%\}|\$\{.*?\}",
    ],
    'nosqli': [
        r"\{\s*\$where\s*:|\{\s*\$regex\s*:",
        r"\{\s*\$ne\s*:|\{\s*\$gt\s*:|\{\s*\$lt\s*:",
    ],
    'open_redirect': [
        r"(url=|redirect=|to=|link=|path=).*?(https?:\/\/|\/\/)",
    ],
    'evasion': [
        r"(\\x[0-9a-f]{2}|\\u[0-9a-f]{4}|%[0-9a-f]{2}){3,}",
        r"fromcharcode|String\.fromCharCode",
    ],
    
    # Server-Side Request Forgery (SSRF) - More precise
    'ssrf': [
        # Internal IP addresses in request parameters
        r"[?&][^=]*=.*?(?:localhost|127\.0\.0\.1|0\.0\.0\.0|::1)\b",
        # Cloud metadata services
        r"[?&][^=]*=.*?(?:169\.254\.169\.254|metadata\.google|instance-data)",
        # Private IP ranges
        r"[?&][^=]*=.*?(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b",
    ]
}

# Whitelisted patterns - these are common in legitimate traffic
whitelisted_patterns = [
    # Common in URLs
    r"select=(?:[a-zA-Z0-9_]+(?:,\s*[a-zA-Z0-9_]+)*)",  # Field selection parameter
    r"order=(?:asc|desc)",  # Sorting parameter
    r"sort=(?:[a-zA-Z0-9_]+)",  # Sorting parameter
    r"select_?(?:one|all|where)",  # Common field names or parameters
    r"delete=(?:0|1|false|true)",  # Delete flag
    # Common business logic parameters
    r"update_?(?:profile|settings|preferences)",
    r"insert_?(?:mode|type|id)",
    # Common in form fields
    r"<select\b[^>]*>.*?</select>",  # HTML select element
    r"<option\b[^>]*>.*?</option>",  # HTML option element
]

# Improved function to detect attacks with context awareness and scoring
def detect_attacks(request):
    attacks_scores = defaultdict(int)
    
    # Check query string
    try:
        if isinstance(request.query_string, bytes):
            query_string = request.query_string.decode('utf-8', errors='ignore')
        else:
            query_string = str(request.query_string)
    except Exception:
        query_string = ""
    
    # Check headers (exclude some common headers to reduce false positives)
    header_str = ""
    excluded_headers = {'user-agent', 'accept', 'accept-language', 'cookie', 'connection', 'cache-control'}
    for name, value in request.headers.items():
        if name.lower() not in excluded_headers:
            header_str += f"{name}: {value}\n"
    
    # Check path
    path = request.path
    
    # Check request body if available
    body = ""
    if hasattr(request, '_body'):
        try:
            if isinstance(request._body, bytes):
                body = request._body.decode('utf-8', errors='ignore')
            else:
                body = str(request._body)
        except:
            pass
    
    # Check for whitelisted patterns first
    def is_whitelisted(text):
        for pattern in whitelisted_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    # Context-specific checks
    def check_context(data, context_weight=1.0):
        for attack_type, patterns in attack_patterns.items():
            for pattern in patterns:
                matches = re.finditer(pattern, data, re.IGNORECASE)
                for match in matches:
                    matched_text = match.group(0)
                    
                    # Skip if this part matches a whitelisted pattern
                    if is_whitelisted(matched_text):
                        continue
                    
                    # Determine context-specific score
                    score = context_weight
                    
                    # Higher score for inputs in body parameters - more likely attack vectors
                    if context_weight > 0.5 and attack_type in ['sqli', 'xss', 'command_injection']:
                        score += 0.5
                    
                    # If detected in URL parameters, check context more carefully
                    if context_weight < 1.0:
                        # Check if it's part of a filename or path component (less likely to be an attack)
                        if attack_type == 'path_traversal' and '/assets/' in data:
                            score -= 0.5
                        
                        # Check if it looks like a search query (common false positive for SQL injection)
                        if attack_type == 'sqli' and 'search=' in data:
                            score -= 0.5
                    
                    attacks_scores[attack_type] += score
    
    # Check different parts with appropriate weighting
    check_context(query_string, 0.8)  # URL parameters - medium weight
    check_context(header_str, 0.7)    # Headers - lower weight
    check_context(path, 0.6)          # Path - lower weight
    check_context(body, 1.0)          # Body - highest weight
    
    # Return only attack types that exceed the minimum score threshold
    return [attack for attack, score in attacks_scores.items() if score >= ATTACK_DETECTION['min_score']]

# Improved entropy calculation function
def check_entropy(request):
    try:
        if isinstance(request.query_string, bytes):
            query_string = request.query_string.decode('utf-8', errors='ignore')
        else:
            query_string = str(request.query_string)
    except Exception:
        query_string = ""
        
    path = request.path
    
    # Calculate Shannon entropy
    def calculate_entropy(text):
        if not text or len(text) < 10:  # Skip short texts
            return 0
        
        # Count character frequencies
        frequencies = {}
        for char in text:
            if char not in frequencies:
                frequencies[char] = 0
            frequencies[char] += 1
        
        # Calculate entropy
        entropy = 0
        for char in frequencies:
            p = frequencies[char] / len(text)
            entropy -= p * (math.log(p) / math.log(2))
        
        return entropy
    
    # Analyze individual query parameters
    high_entropy_params = 0
    if query_string:
        try:
            # Split by & and then by = to analyze individual parameters
            params = query_string.split('&')
            for param in params:
                if '=' in param:
                    name, value = param.split('=', 1)
                    # Only check relatively long values
                    if len(value) > 15:
                        param_entropy = calculate_entropy(value)
                        # Higher threshold for parameters that commonly contain complex data
                        threshold = 5.0
                        if name.lower() in ['token', 'id', 'key', 'hash', 'signature']:
                            threshold = 5.5  # Higher threshold for known high-entropy params
                        if param_entropy > threshold:
                            high_entropy_params += 1
        except:
            pass
    
    path_entropy = calculate_entropy(path)
    
    # Only flag if multiple indicators are present
    if (path_entropy > 4.8 and high_entropy_params > 0) or high_entropy_params >= 2:
        return "HIGH_ENTROPY_DETECTED"
    
    return None

# Enhanced Rate Limiting with better burst detection and adaptation
def check_rate_limits(ip):
    now = time.time()
    stats = ip_stats[ip]
    
    # Clean up old requests
    stats.requests = [t for t in stats.requests if now - t < RATE_LIMITS['window_size']]
    
    # Add current request
    stats.requests.append(now)
    
    # Update last seen
    stats.last_seen = now
    
    # Dynamic rate limiting - adjust based on global traffic
    window_size = RATE_LIMITS['window_size']
    max_requests = RATE_LIMITS['max_requests']
    
    # If we have a baseline, adjust limits during anomalous traffic
    if baseline_requests_per_second > 0:
        current_rps = len([r for r in stats.requests if now - r < 1])
        
        # If current client RPS is much higher than baseline, temporarily tighten limits
        if current_rps > baseline_requests_per_second * 3:
            max_requests = int(max_requests * 0.8)  # 20% stricter
    
    # Check for rate limiting
    if len(stats.requests) > max_requests:
        return "RATE_LIMIT_EXCEEDED"
    
    # Check for burst attacks with better precision
    burst_window = RATE_LIMITS['burst_window']
    burst_threshold = RATE_LIMITS['burst_threshold']
    
    # Check the distribution of requests over the burst window
    time_slots = [0] * burst_window
    for req_time in stats.requests:
        slot = min(int(now - req_time), burst_window - 1)
        if 0 <= slot < burst_window:
            time_slots[slot] += 1
    
    # The burst must be concentrated in a single second to be considered malicious
    if max(time_slots) > burst_threshold:
        return "BURST_ATTACK_DETECTED"
    
    return None


import requests

def update_database_json(attacks, client_ip, reason_of_block, db_path="../Dashboard_v2/public/database.json"):
    url = "https://team.sarva.cloud/UpdateDatabaseWithBlockchain"
    
    payload = {
        "attacks": attacks,
        "clientIp": client_ip,
        "reasonOfBlock": reason_of_block
    }

    try:
        response = requests.post(url, json=payload, timeout=5)
        return {
            "status_code": response.status_code,
            "response": response.text
        }
    except requests.exceptions.RequestException as e:
        return {
            "error": str(e)
        }


def update_database_json_OLD(attacks, client_ip, reason_of_block, db_path="../Dashboard_v2/public/database.json"):
    # Load existing data
    import os, json, pytz
    from datetime import datetime

    if os.path.exists(db_path):
        with open(db_path, "r") as f:
            data = json.load(f)
    else:
        print(f"Database file {db_path} not found.")
        return

    # Navigate to attack categories
    attack_categories = data.get("attack_categories")
    if not attack_categories:
        print("Key 'attack_categories' not found in database.")
        return

    # Ensure the attack type exists
    if attacks not in attack_categories:
        print(f"Attack type '{attacks}' not found in database.")
        return

    # Generate new ID
    existing_ids = attack_categories[attacks].keys()
    new_id = str(max([int(k) for k in existing_ids] + [0]) + 1)

    # Get current time in Indian timezone
    ist = pytz.timezone("Asia/Kolkata")
    current_time = datetime.now(ist).strftime("%Y-%m-%d %H:%M:%S")

    # Add new entry
    attack_categories[attacks][new_id] = {
        "Attacker_Ip": client_ip,
        "Attack_On_Endpoint": reason_of_block,
        "Attack_Time": current_time
    }

    # Save back to file
    with open(db_path, "w") as f:
        json.dump(data, f, indent=4)

    print(f"[+] Updated database.json | Attack: {attacks} | ID: {new_id}")
   



# Improved behavioral analysis with context awareness
def analyze_behavior(ip, request):
    now = time.time()
    stats = ip_stats[ip]
    
    # Update stats
    stats.paths.add(request.path)
    user_agent = request.headers.get('User-Agent', '')
    stats.user_agents.add(user_agent)
    stats.methods[request.method] += 1
    
    # Clean up old data
    session_window = BEHAVIORAL['session_tracking_window']
    
    # Check suspicious user agents with better precision
    for agent in stats.user_agents:
        if agent:  # Skip empty user agents
            for suspicious in BEHAVIORAL['suspicious_user_agents']:
                # Use word boundaries to avoid partial matches
                if re.search(r'\b' + re.escape(suspicious.lower()) + r'\b', agent.lower()):
                    return "SUSPICIOUS_USER_AGENT"
    
    # Path diversity check - only if it's a continued session
    if now - stats.last_seen < session_window:
        # Normalize path diversity based on session length
        session_length = now - (stats.last_seen - len(stats.paths) * 30)  # Estimate length
        path_diversity_per_minute = len(stats.paths) / (session_length / 60)
        
        # Adjust threshold based on site section
        threshold = BEHAVIORAL['path_diversity_threshold']
        if any(p.startswith('/api/') for p in stats.paths):
            threshold *= 1.5  # API endpoints often have high legitimate diversity
        
        if path_diversity_per_minute > threshold:
            return "PATH_SCAN_DETECTED"
    
    # Error rate check - more context-aware
    if stats.errors > BEHAVIORAL['error_threshold']:
        # Check if errors are spread out over time or concentrated
        if now - stats.last_seen > 60 and stats.errors > BEHAVIORAL['error_threshold'] * 2:
            return "HIGH_ERROR_RATE"
    
    # Method distribution check - more context-aware
    get_count = stats.methods.get('GET', 0)
    post_count = stats.methods.get('POST', 0)
    other_methods = sum(stats.methods.get(m, 0) for m in ['PUT', 'DELETE', 'PATCH'])
    
    # Only flag unusual method distribution for sustained sessions with multiple requests
    total_requests = sum(stats.methods.values())
    if total_requests > 10:
        # Different thresholds for different contexts
        if any(p.startswith('/api/') for p in stats.paths):
            # API endpoints often use various methods legitimately
            if other_methods > (get_count + post_count) * 3:
                return "UNUSUAL_METHOD_DISTRIBUTION"
        else:
            # Regular web navigation should be mostly GET with some POST
            if other_methods > (get_count + post_count):
                return "UNUSUAL_METHOD_DISTRIBUTION"
    
    return None

# Improved global traffic analysis function
def check_global_traffic():
    global baseline_requests_per_second
    now = time.time()
    
    # Count requests in the last second
    requests_last_second = sum(1 for stats in ip_stats.values() 
                             for req_time in stats.requests if now - req_time < 1)
    
    # Add to history
    traffic_history.append(requests_last_second)
    
    # Calculate baseline if we have enough data
    if len(traffic_history) >= 30:
        # Use median and standard deviation for more robust anomaly detection
        median_rps = statistics.median(traffic_history)
        
        try:
            stdev_rps = statistics.stdev(traffic_history)
            
            # Use Z-score for anomaly detection
            z_score = (requests_last_second - median_rps) / max(1, stdev_rps)
            
            # Update baseline gradually for smoother adaptation
            baseline_requests_per_second = 0.9 * baseline_requests_per_second + 0.1 * median_rps
            
            # Only alert on significant deviations (Z-score > 3)
            if z_score > 3 and requests_last_second > baseline_requests_per_second * traffic_anomaly_threshold:
                return "GLOBAL_TRAFFIC_ANOMALY"
        except:
            # Fall back to simpler detection if standard deviation calculation fails
            baseline_requests_per_second = median_rps
            if requests_last_second > baseline_requests_per_second * traffic_anomaly_threshold * 1.5:
                return "GLOBAL_TRAFFIC_ANOMALY"
    
    return None

# Improved payload analysis
def analyze_payload(request):
    content_length = int(request.headers.get('Content-Length', 0))
    
    # Check for payload size limits with content type awareness
    content_type = request.headers.get('Content-Type', '').lower()
    
    # Adjust limit based on content type
    limit = RATE_LIMITS['max_payload_size']
    
    # Different limits for different content types
    if 'multipart/form-data' in content_type:
        # File uploads need larger limits
        limit = limit * 2
    elif 'application/json' in content_type:
        # JSON data might be more compact
        pass
    elif 'text/plain' in content_type:
        # Plain text might be spam if very large
        pass
    
    if content_length > limit:
        return "PAYLOAD_TOO_LARGE"
    
    return None

# Geographic/ASN blocking with improved handling
def check_geo_restrictions(ip):
    # Check if IP is in the blacklist
    if ip in BLACKLIST['ips']:
        return "GEO_RESTRICTED"
    
    # In production, you would use a proper GeoIP database here
    # This is just a placeholder implementation
    
    return None

# Handle and forward requests
async def forward_request(request):
    # Get client IP, handling potential proxies
    client_ip = request.headers.get('X-Forwarded-For', request.remote)
    if ',' in client_ip:  # Handle multiple IPs in X-Forwarded-For
        client_ip = client_ip.split(',')[0].strip()
    
    host = request.headers.get("Host", "")
    path = request.path
    config = DOMAIN_CONFIGS.get(host)

    # Log the request
    logging.info(f"Request from {client_ip} to {host}: {request.method} {request.path}")
    
    # Check if we have a valid domain configuration
    if not config:
        ip_stats[client_ip].errors += 1
        return web.Response(status=400, text="Unknown domain")
    
    # Check whitelisted paths
    if path in WHITELIST['paths']:
        try:
            async with ClientSession() as session:
                url = f"{config['target']}{request.rel_url}"
                async with session.request(
                    method=request.method,
                    url=url,
                    headers={k: v for k, v in request.headers.items() if k.lower() != 'host'},
                    data=await request.read()
                ) as resp:
                    body = await resp.read()
                    return web.Response(status=resp.status, body=body, headers=resp.headers)
        except Exception as e:
            logging.error(f"Error forwarding request to whitelisted path: {e}")
            return web.Response(status=500, text="Internal Server Error")
    
    # Check if IP is whitelisted
    if client_ip in WHITELIST['ips']:
        try:
            async with ClientSession() as session:
                url = f"{config['target']}{request.rel_url}"
                async with session.request(
                    method=request.method,
                    url=url,
                    headers={k: v for k, v in request.headers.items() if k.lower() != 'host'},
                    data=await request.read()
                ) as resp:
                    body = await resp.read()
                    return web.Response(status=resp.status, body=body, headers=resp.headers)
        except Exception as e:
            logging.error(f"Error forwarding request from whitelisted IP: {e}")
            return web.Response(status=500, text="Internal Server Error")
    
    # Check if IP is currently blocked
    now = time.time()
    if client_ip in blocked_ips and blocked_ips[client_ip] > now:
        block_time_remaining = int(blocked_ips[client_ip] - now)
        logging.warning(f"Blocked IP {client_ip} attempted access - blocked for {block_time_remaining} more seconds")
        return web.Response(status=403, text=f"Your IP is temporarily blocked by the WAF. Try again later.")
    elif client_ip in blocked_ips:
        # Remove from blocked list if time has expired
        del blocked_ips[client_ip]
    
    # Store request body for analysis but limit size
    try:
        max_body_size = 10 * 1024 * 1024  # 10MB limit for inspection
        request._body = await request.content.read(max_body_size)
    except Exception as e:
        logging.error(f"Error reading request body: {e}")
        request._body = b''
    
    # Run security checks in parallel
    loop = asyncio.get_event_loop()
    
    with concurrent.futures.ThreadPoolExecutor() as executor:
        # Run multiple checks in parallel
        rate_limit_result = await loop.run_in_executor(executor, check_rate_limits, client_ip)
        attacks = await loop.run_in_executor(executor, detect_attacks, request)
        behavior_result = await loop.run_in_executor(executor, analyze_behavior, client_ip, request)
        global_traffic = await loop.run_in_executor(executor, check_global_traffic)
        payload_result = await loop.run_in_executor(executor, analyze_payload, request)
        geo_result = await loop.run_in_executor(executor, check_geo_restrictions, client_ip)
        entropy_result = await loop.run_in_executor(executor, check_entropy, request)
    
    # Combine security checks
    block_reason = None
    
    if rate_limit_result:
        block_reason = rate_limit_result
    elif attacks:
        block_reason = f"ATTACK_DETECTED: {', '.join(attacks)}"
    elif behavior_result:
        block_reason = behavior_result
    elif global_traffic:
        block_reason = global_traffic
    elif payload_result:
        block_reason = payload_result
    elif geo_result:
        block_reason = geo_result
    elif entropy_result:
        block_reason = entropy_result
    
    # If any check failed, block the IP
    if block_reason:
        # Block for the configured duration
        blocked_ips[client_ip] = now + RATE_LIMITS['ip_block_duration']
        
        # Log the block
        logging.warning(f"[Attack Detected:- {attacks} and [User BLOCKED] {client_ip} - Reason: {block_reason}")
        update_database_json(
            attacks=attacks[0],
            client_ip=client_ip,
            reason_of_block=block_reason
        )

        # Return block response
        return web.Response(status=403, text=f"Request blocked by WAF: {block_reason}")
    
    # If all checks passed, forward the request
    try:
        async with ClientSession() as session:
            url = f"{config['target']}{request.rel_url}"
            
            # Use cached request body if available
            if hasattr(request, '_body'):
                body_data = request._body
            else:
                body_data = await request.read()
            
            async with session.request(
                method=request.method,
                url=url,
                headers={k: v for k, v in request.headers.items() if k.lower() != 'host'},
                data=body_data
            ) as resp:
                # Track errors from backend
                if resp.status >= 400:
                    ip_stats[client_ip].errors += 1
                
                body = await resp.read()
                return web.Response(status=resp.status, body=body, headers=resp.headers)
    except Exception as e:
        logging.error(f"Error forwarding request: {e}")
        ip_stats[client_ip].errors += 1
        return web.Response(status=500, text="Internal Server Error")

# Maintenance tasks
async def maintenance_task():
    while True:
        try:
            now = time.time()
            
            # Clean up old IP stats
            stale_time = now - (BEHAVIORAL['session_tracking_window'] * 2)
            stale_ips = [ip for ip, stats in ip_stats.items() 
                        if stats.last_seen < stale_time and ip not in blocked_ips]
            
            for ip in stale_ips:
                del ip_stats[ip]
            
            # Remove expired blocks
            expired_blocks = [ip for ip, expiry in blocked_ips.items() if expiry < now]
            for ip in expired_blocks:
                del blocked_ips[ip]
            
            if stale_ips or expired_blocks:
                logging.info(f"Maintenance: Removed {len(stale_ips)} stale IPs and {len(expired_blocks)} expired blocks")
            
            # Wait before next maintenance cycle
            await asyncio.sleep(60)
        except Exception as e:
            logging.error(f"Error in maintenance task: {e}")
            await asyncio.sleep(60)

# Setup multi-cert SSL with SNI
def create_multi_ssl_context():
    default_domain = next(iter(DOMAIN_CONFIGS))
    default_cert = DOMAIN_CONFIGS[default_domain]['cert']
    default_key = DOMAIN_CONFIGS[default_domain]['key']

    default_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    default_context.load_cert_chain(default_cert, default_key)

    contexts = {}
    for domain, cfg in DOMAIN_CONFIGS.items():
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(cfg['cert'], cfg['key'])
        contexts[domain.encode()] = ctx

    def sni_callback(sock, requested_hostname, ssl_context):
        ctx = contexts.get(requested_hostname.encode(), default_context)
        sock.context = ctx

    default_context.set_servername_callback(sni_callback)
    return default_context

# Start HTTP health check server
async def start_health_server():
    async def health_handler(request):
        return web.Response(text="WAF is running")
    
    app = web.Application()
    app.router.add_get('/health', health_handler)
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', 9090)
    await site.start()
    
    logging.info("Health check server started on port 9090")

# Start WAF server
async def start_server():
    # Initialize the application
    app = web.Application(client_max_size=RATE_LIMITS['max_payload_size'])
    app.router.add_route('*', '/{tail:.*}', forward_request)

    # Start the health check server
    await start_health_server()
    
    # Start the maintenance task
    asyncio.create_task(maintenance_task())
    
    # Start the WAF server
    runner = web.AppRunner(app)
    await runner.setup()
    ssl_context = create_multi_ssl_context()
    site = web.TCPSite(runner, '0.0.0.0', 443, ssl_context=ssl_context)
    await site.start()

    logging.info(f"[+] Multi-domain HTTPS WAF started on port 443")
    
    try:
        while True:
            await asyncio.sleep(3600)
    finally:
        await runner.cleanup()

if __name__ == '__main__':
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        logging.info("WAF server shutting down...")