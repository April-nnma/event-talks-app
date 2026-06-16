import xml.etree.ElementTree as ET
import requests
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Atom namespace
NAMESPACE = {'ns': 'http://www.w3.org/2005/Atom'}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        entries = []
        for entry_el in root.findall('ns:entry', NAMESPACE):
            title_el = entry_el.find('ns:title', NAMESPACE)
            id_el = entry_el.find('ns:id', NAMESPACE)
            updated_el = entry_el.find('ns:updated', NAMESPACE)
            link_el = entry_el.find('ns:link[@rel="alternate"]', NAMESPACE)
            if link_el is None:
                link_el = entry_el.find('ns:link', NAMESPACE)
            content_el = entry_el.find('ns:content', NAMESPACE)
            
            title = title_el.text if title_el is not None else ""
            entry_id = id_el.text if id_el is not None else ""
            updated = updated_el.text if updated_el is not None else ""
            link = link_el.attrib.get('href', '') if link_el is not None else ""
            content = content_el.text if content_el is not None else ""
            
            entries.append({
                "date": title,
                "id": entry_id,
                "updated": updated,
                "link": link,
                "content": content
            })
            
        return jsonify({
            "status": "success",
            "entries": entries
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
