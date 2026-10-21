from html.parser import HTMLParser

class MyHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
    def handle_starttag(self, tag, attrs):
        if tag not in ['img', 'br', 'hr', 'input', 'meta', 'link']:
            self.stack.append((tag, self.getpos()))
    def handle_endtag(self, tag):
        if not self.stack:
            print(f"Error: Unexpected closing tag {tag} at {self.getpos()}")
            return
        last_tag, pos = self.stack.pop()
        if last_tag != tag:
            print(f"Error: Mismatched tag at {self.getpos()}: expected {last_tag} (opened at {pos}), but got {tag}")
            self.stack.append((last_tag, pos)) # put it back to continue finding errors

parser = MyHTMLParser()
with open('src/app/components/deportivo/actividades/deportivo-actividades.html') as f:
    parser.feed(f.read())
