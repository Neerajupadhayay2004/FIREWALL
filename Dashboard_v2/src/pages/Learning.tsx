import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const learningResources = {
  blogs: [
    {
      title: "OWASP Top 10 Security Risks",
      description: "Learn about the most critical web application security risks",
      url: "https://owasp.org/www-project-top-ten/",
      category: "Fundamentals"
    },
    {
      title: "SQL Injection Prevention Cheat Sheet",
      description: "Comprehensive guide to preventing SQL injection attacks",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
      category: "Defense"
    },
    {
      title: "XSS Attack Prevention",
      description: "Best practices for preventing cross-site scripting attacks",
      url: "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html",
      category: "Defense"
    },
    {
      title: "Understanding CSRF Attacks",
      description: "Deep dive into Cross-Site Request Forgery vulnerabilities",
      url: "https://owasp.org/www-community/attacks/csrf",
      category: "Attack Vectors"
    },
    {
      title: "Web Application Firewall Best Practices",
      description: "How to configure and optimize your WAF",
      url: "https://www.cloudflare.com/learning/ddos/glossary/web-application-firewall-waf/",
      category: "Infrastructure"
    }
  ],
  videos: [
    {
      title: "SQL Injection Explained",
      description: "Computerphile - Understanding SQL injection attacks",
      url: "https://www.youtube.com/watch?v=ciNHn38EyRc",
      duration: "9:20"
    },
    {
      title: "How Hackers Use XSS",
      description: "Live demonstration of cross-site scripting attacks",
      url: "https://www.youtube.com/watch?v=L5l9lSnNMxg",
      duration: "15:42"
    },
    {
      title: "Ethical Hacking Full Course",
      description: "Complete cybersecurity course for beginners",
      url: "https://www.youtube.com/watch?v=3Kq1MIfTWCE",
      duration: "15:20:00"
    },
    {
      title: "Web Application Security",
      description: "Stanford lecture on web security fundamentals",
      url: "https://www.youtube.com/watch?v=WlmKwIe9z1Q",
      duration: "1:19:45"
    },
    {
      title: "Firewalls Explained",
      description: "How network firewalls protect against attacks",
      url: "https://www.youtube.com/watch?v=kDEX1HXybrU",
      duration: "12:34"
    },
    {
      title: "Penetration Testing Tutorial",
      description: "Learn the basics of ethical hacking and pentesting",
      url: "https://www.youtube.com/watch?v=3FNYvj2U0HM",
      duration: "2:30:15"
    }
  ]
};

const Learning = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => navigate("/dashboard")}
          className="mb-6 border-primary/30"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
            Learning Hub
          </h1>
          <p className="text-muted-foreground">
            Expand your cybersecurity knowledge with curated resources
          </p>
        </div>

        <Tabs defaultValue="blogs" className="space-y-6">
          <TabsList className="bg-card/50 border border-primary/30">
            <TabsTrigger value="blogs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BookOpen className="w-4 h-4 mr-2" />
              Blog Articles
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Video className="w-4 h-4 mr-2" />
              Video Tutorials
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blogs" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {learningResources.blogs.map((blog, idx) => (
                <Card key={idx} className="cyber-border bg-card/50 backdrop-blur-sm hover:cyber-glow transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-foreground text-lg">{blog.title}</CardTitle>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full whitespace-nowrap">
                        {blog.category}
                      </span>
                    </div>
                    <CardDescription>{blog.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      className="w-full border-primary/30"
                      onClick={() => window.open(blog.url, '_blank')}
                    >
                      Read Article
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningResources.videos.map((video, idx) => (
                <Card key={idx} className="cyber-border bg-card/50 backdrop-blur-sm hover:cyber-glow transition-all">
                  <CardHeader>
                    <CardTitle className="text-foreground text-lg">{video.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{video.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Duration: {video.duration}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full border-primary/30"
                      onClick={() => window.open(video.url, '_blank')}
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Watch Video
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Resources Section */}
        <Card className="cyber-border bg-card/50 backdrop-blur-sm mt-8">
          <CardHeader>
            <CardTitle className="text-foreground">Recommended Platforms</CardTitle>
            <CardDescription>Continue your learning journey on these platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col border-primary/30"
                onClick={() => window.open('https://www.hackthebox.com/', '_blank')}
              >
                <span className="font-bold text-lg mb-1">Hack The Box</span>
                <span className="text-xs text-muted-foreground">Hands-on pentesting labs</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col border-primary/30"
                onClick={() => window.open('https://tryhackme.com/', '_blank')}
              >
                <span className="font-bold text-lg mb-1">TryHackMe</span>
                <span className="text-xs text-muted-foreground">Interactive security training</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex-col border-primary/30"
                onClick={() => window.open('https://portswigger.net/web-security', '_blank')}
              >
                <span className="font-bold text-lg mb-1">PortSwigger Academy</span>
                <span className="text-xs text-muted-foreground">Free web security training</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Learning;
