from flask import Flask, jsonify
import os
import shutil

app = Flask(__name__)

@app.route('/disk-usage', methods=['GET'])
def disk_usage():
    folder = '/srv/tusd-data/data'
    total, used, free = shutil.disk_usage(folder)

    return jsonify({
        'total': total,
        'used': used,
        'free': free
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
