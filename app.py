from flask import Flask, request, jsonify, render_template
from backend.kmeans import kmeans_full

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/kmeans', methods=['POST'])
def perform_kmeans():
    data = request.json.get('data')
    k = request.json.get('k')
    initialization_method = request.json.get('initialization_method', 'Random')
    initial_centroids = request.json.get('initial_centroids', [])

    if not data or not k:
        return jsonify({'error': 'Data and k are required.'}), 400

    try:
        history = kmeans_full(data, k, initialization_method, initial_centroids)
        # Return the full history of steps
        return jsonify({
            'history': history
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=3000, debug=True)  # Running on port 3000