#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Script for inserting test data directly into MongoDB for the RunCash application.
"""

import pymongo
import random
import datetime
import uuid
import time
import hashlib
import os

# MongoDB connection settings
MONGODB_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/runcash')
DB_NAME = os.environ.get('MONGODB_DB_NAME', 'runcash')

# Roulette IDs and names
ROULETTES = [
    {"id": "2010016", "nome": "Immersive Roulette"},
    {"id": "2010017", "nome": "Auto-Roulette"},
    {"id": "2010096", "nome": "Speed Auto Roulette"},
    {"id": "2010065", "nome": "Bucharest Auto-Roulette"},
    {"id": "2380335", "nome": "Brazilian Mega Roulette"},
    {"id": "2010098", "nome": "Auto-Roulette VIP"}
]

def connect_to_mongodb():
    """Connect to MongoDB and return database client"""
    try:
        print(f"Connecting to MongoDB at: {MONGODB_URI}")
        client = pymongo.MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        # Test connection
        client.server_info()
        print("Successfully connected to MongoDB")
        
        # List available collections
        collections = db.list_collection_names()
        print(f"Available collections: {', '.join(collections)}")
        
        return client, db
    except Exception as e:
        print(f"Error connecting to MongoDB: {str(e)}")
        return None, None

def create_collections(db):
    """Create necessary collections if they don't exist"""
    try:
        # Create roletas collection if it doesn't exist
        if "roletas" not in db.list_collection_names():
            print("Creating 'roletas' collection...")
            db.create_collection("roletas")
        
        # Create roleta_numeros collection if it doesn't exist
        if "roleta_numeros" not in db.list_collection_names():
            print("Creating 'roleta_numeros' collection...")
            db.create_collection("roleta_numeros")
        
        print("Collections created/verified successfully")
        return True
    except Exception as e:
        print(f"Error creating collections: {str(e)}")
        return False

def insert_roulettes(db):
    """Insert roulette data into the roletas collection"""
    try:
        roletas_collection = db.roletas
        count = 0
        
        for roulette in ROULETTES:
            roulette_id = roulette["id"]
            
            # Check if roulette already exists
            existing = roletas_collection.find_one({"id": roulette_id})
            if existing:
                print(f"Roulette {roulette['nome']} already exists, updating...")
                
                # Update fields
                roletas_collection.update_one(
                    {"id": roulette_id},
                    {"$set": {
                        "nome": roulette["nome"],
                        "atualizado_em": datetime.datetime.utcnow(),
                        "ativa": True,
                        "estado_estrategia": "NEUTRAL",
                        "terminais_gatilho": [1, 2, 3],
                        "vitorias": random.randint(1, 5),
                        "derrotas": random.randint(1, 3)
                    }}
                )
            else:
                print(f"Inserting roulette: {roulette['nome']}")
                
                # Insert new roulette
                roletas_collection.insert_one({
                    "id": roulette_id,
                    "nome": roulette["nome"],
                    "criado_em": datetime.datetime.utcnow(),
                    "atualizado_em": datetime.datetime.utcnow(),
                    "ativa": True,
                    "estado_estrategia": "NEUTRAL",
                    "numero_gatilho": random.randint(1, 36),
                    "terminais_gatilho": [1, 2, 3],
                    "vitorias": random.randint(1, 5),
                    "derrotas": random.randint(1, 3)
                })
                count += 1
        
        print(f"Inserted/updated {count} roulettes")
        return True
    except Exception as e:
        print(f"Error inserting roulettes: {str(e)}")
        return False

def get_numero_color(numero):
    """Determine color of a roulette number"""
    if numero == 0:
        return "verde"
    
    red_numbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]
    return "vermelho" if numero in red_numbers else "preto"

def insert_roulette_numbers(db, roulette_id, roulette_name, count=20):
    """Insert random numbers for a specific roulette"""
    try:
        numbers_collection = db.roleta_numeros
        inserted = 0
        
        print(f"Inserting {count} numbers for roulette: {roulette_name}")
        
        for i in range(count):
            # Generate random number between 0 and 36
            numero = random.randint(0, 36)
            
            # Get color
            cor = get_numero_color(numero)
            
            # Generate timestamp with some variance
            minutes_ago = i * 2  # Each number is 2 minutes apart
            timestamp = datetime.datetime.utcnow() - datetime.timedelta(minutes=minutes_ago)
            
            # Insert the number
            result = numbers_collection.insert_one({
                "roleta_id": roulette_id,
                "roleta_nome": roulette_name,
                "numero": numero,
                "cor": cor,
                "timestamp": timestamp
            })
            
            if result.inserted_id:
                inserted += 1
                print(f"  Inserted number {numero} ({cor}) at {timestamp}")
            
            # Small delay to avoid overwhelming the database
            time.sleep(0.1)
        
        print(f"Successfully inserted {inserted} numbers for {roulette_name}")
        return inserted
    except Exception as e:
        print(f"Error inserting numbers: {str(e)}")
        return 0

def main():
    """Main function to run the script"""
    print("\n===== RunCash Test Data Insertion Tool =====\n")
    
    # Connect to MongoDB
    client, db = connect_to_mongodb()
    if client is None or db is None:
        print("Exiting due to MongoDB connection error")
        return
    
    try:
        # Create collections if needed
        if not create_collections(db):
            print("Exiting due to error creating collections")
            return
        
        # Insert/update roulettes
        if not insert_roulettes(db):
            print("Error inserting roulettes")
        
        # Ask which roulette to add numbers for
        print("\nAvailable roulettes:")
        for i, roulette in enumerate(ROULETTES):
            print(f"{i+1}. {roulette['nome']} (ID: {roulette['id']})")
        
        # Add numbers for all roulettes
        for roulette in ROULETTES:
            print(f"\nInserting numbers for {roulette['nome']}...")
            num_inserted = insert_roulette_numbers(
                db, 
                roulette["id"], 
                roulette["nome"], 
                count=25  # Insert 25 numbers per roulette
            )
            print(f"Inserted {num_inserted} numbers for {roulette['nome']}")
        
        print("\nTest data insertion complete!")
    
    finally:
        # Close the MongoDB connection
        if client:
            client.close()
            print("MongoDB connection closed")

if __name__ == "__main__":
    main() 