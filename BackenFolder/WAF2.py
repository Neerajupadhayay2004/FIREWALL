from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return 'Under Maintenance. Site Will Be Live Soon....'

@app.route('/Gets')
def hellos():
    return 'Get method Flasks'


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8001)
