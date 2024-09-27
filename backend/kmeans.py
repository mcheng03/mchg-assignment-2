# backend/kmeans.py

import random
import numpy as np

def initialize_centroids(method, data, k, initial_centroids=[]):
    # Ensure k is not greater than 100
    k = min(k, 100)

    if method == 'Random':
        return true_random_initialization(data, k)
    elif method == 'Farthest First':
        return farthest_first_initialization(data, k)
    elif method == 'KMeans++':
        return kmeans_plus_plus_initialization(data, k)
    elif method == 'Manual':
        if len(initial_centroids) != k:
            raise ValueError(f'Number of initial centroids provided ({len(initial_centroids)}) does not match k ({k}).')
        return initial_centroids[:k]  # Limit to k centroids
    else:
        raise ValueError("Unsupported initialization method.")

def true_random_initialization(data, k):
    if k == len(data):
        return data  # Use all data points as centroids
    
    # Determine the bounds of the data
    min_x = min(point[0] for point in data)
    max_x = max(point[0] for point in data)
    min_y = min(point[1] for point in data)
    max_y = max(point[1] for point in data)
    
    # Generate k random points within these bounds
    return [
        [random.uniform(min_x, max_x), random.uniform(min_y, max_y)]
        for _ in range(k)
    ]

# The rest of your functions remain unchanged

def random_initialization(data, k):
    return random.sample(data, k)

def farthest_first_initialization(data, k):
    centroids = [random.choice(data)]
    for _ in range(k-1):
        distances = [min(np.linalg.norm(np.array(point) - np.array(c)) for c in centroids) for point in data]
        next_centroid = data[np.argmax(distances)]
        centroids.append(next_centroid)
    return centroids

def kmeans_plus_plus_initialization(data, k):
    centroids = [random.choice(data)]
    for _ in range(k-1):
        distances = [min(np.linalg.norm(np.array(point) - np.array(c))**2 for c in centroids) for point in data]
        total_distance = sum(distances)
        probabilities = [d / total_distance for d in distances]
        cumulative_prob = np.cumsum(probabilities)
        r = random.random()
        for idx, prob in enumerate(cumulative_prob):
            if r < prob:
                centroids.append(data[idx])
                break
    return centroids

def assign_clusters(data, centroids):
    clusters = [[] for _ in centroids]
    for point in data:
        distances = [np.linalg.norm(np.array(point) - np.array(c)) for c in centroids]
        closest_centroid = distances.index(min(distances))
        clusters[closest_centroid].append(point)
    return clusters

def update_centroids(clusters):
    new_centroids = []
    for cluster in clusters:
        if cluster:
            new_centroid = np.mean(cluster, axis=0).tolist()
            new_centroids.append(new_centroid)
        else:
            # Handle empty cluster by assigning a random point
            new_centroids.append([random.uniform(-10, 10), random.uniform(-10, 10)])
    return new_centroids

def has_converged(old_centroids, new_centroids):
    return all(np.linalg.norm(np.array(old) - np.array(new)) <= 1e-4 for old, new in zip(old_centroids, new_centroids))

def kmeans_step(data, centroids):
    clusters = assign_clusters(data, centroids)
    new_centroids = update_centroids(clusters)
    return new_centroids, clusters

def kmeans_full(data, k, initialization_method='Random', initial_centroids=[]):
    # Ensure k is not greater than 100 or the number of data points
    k = min(k, 100, len(data))

    centroids = initialize_centroids(initialization_method, data, k, initial_centroids)
    history = [(centroids.copy(), assign_clusters(data, centroids))]
    
    for _ in range(100):  # max_iterations set to 100
        new_centroids, clusters = kmeans_step(data, centroids)
        
        if has_converged(centroids, new_centroids):
            history.append((new_centroids.copy(), clusters))
            break
        
        history.append((new_centroids.copy(), clusters))
        centroids = new_centroids
    
    return history
    