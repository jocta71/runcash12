import firebase_admin
from firebase_admin import credentials, db
import logging
import os
import json
from datetime import datetime
import time

class FirebaseClient:
    def __init__(self, credentials_path):
        """
        Inicializa o cliente do Firebase usando o arquivo de credenciais fornecido.
        
        Args:
            credentials_path (str): Caminho para o arquivo de credenciais do Firebase
        """
        try:
            # Verificar se já foi inicializado
            if not firebase_admin._apps:
                logging.info(f"Inicializando Firebase com credenciais de: {credentials_path}")
                
                # Carregar credenciais
                cred = credentials.Certificate(credentials_path)
                
                # Inicializar o app com URL do banco
                firebase_admin.initialize_app(cred, {
                    'databaseURL': 'https://extrator-roleta-default-rtdb.firebaseio.com'
                })
                
                logging.info("Firebase inicializado com sucesso")
            else:
                logging.info("Firebase já estava inicializado")
                
        except Exception as e:
            logging.error(f"Erro ao inicializar Firebase: {str(e)}")
            raise
    
    def get_roletas_ref(self):
        """Retorna a referência para o nó de roletas no Firebase"""
        try:
            return db.reference('roletas')
        except Exception as e:
            logging.error(f"Erro ao obter referência do Firebase: {str(e)}")
            return None
    
    def send_roleta_data(self, nome_roleta, dados):
        """
        Envia dados de uma roleta para o Firebase
        
        Args:
            nome_roleta (str): Nome da roleta
            dados (dict): Dados da roleta a serem enviados
        """
        try:
            # Formatar o nome da roleta para ser uma chave válida no Firebase
            nome_formatado = nome_roleta.strip().replace(' ', '_').replace('.', '').lower()
            
            # Obter referência para o nó da roleta específica
            roleta_ref = db.reference(f'roletas/{nome_formatado}')
            
            # Adicionar timestamp da atualização
            dados_com_timestamp = dados.copy()
            dados_com_timestamp['firebase_timestamp'] = {
                '.sv': 'timestamp'  # Usa o timestamp do servidor
            }
            
            # Enviar dados
            roleta_ref.update(dados_com_timestamp)
            logging.info(f"Dados enviados para o Firebase: {nome_roleta}")
            return True
            
        except Exception as e:
            logging.error(f"Erro ao enviar dados para o Firebase: {str(e)}")
            return False
    
    def send_all_roletas(self, dados_roletas):
        """
        Envia dados de múltiplas roletas para o Firebase
        
        Args:
            dados_roletas (dict): Dicionário com dados de todas as roletas
        """
        try:
            # Obter referência para o nó de roletas
            roletas_ref = db.reference('roletas')
            
            # Preparar dados formatados
            dados_formatados = {}
            
            for nome_roleta, dados in dados_roletas.items():
                # Formatar o nome da roleta para ser uma chave válida no Firebase
                nome_formatado = nome_roleta.strip().replace(' ', '_').replace('.', '').lower()
                
                # Adicionar timestamp da atualização
                dados_com_timestamp = dados.copy()
                dados_com_timestamp['firebase_timestamp'] = {
                    '.sv': 'timestamp'  # Usa o timestamp do servidor
                }
                
                dados_formatados[nome_formatado] = dados_com_timestamp
            
            # Enviar todos os dados de uma vez
            roletas_ref.update(dados_formatados)
            logging.info(f"Dados de {len(dados_formatados)} roletas enviados para o Firebase")
            return True
            
        except Exception as e:
            logging.error(f"Erro ao enviar múltiplos dados para o Firebase: {str(e)}")
            return False 