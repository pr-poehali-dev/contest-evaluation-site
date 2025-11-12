import json
import os
import psycopg2
import secrets
import string
from typing import Dict, Any

def generate_access_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(8))

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage experts - create, list, delete
    Args: event with httpMethod, body for POST, queryStringParameters for GET
    Returns: HTTP response with expert data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Code',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    admin_code = headers.get('X-Admin-Code') or headers.get('x-admin-code')
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    cur.execute("SELECT id FROM experts WHERE access_code = %s AND role = 'admin'", (admin_code,))
    is_admin = cur.fetchone() is not None
    
    if not is_admin:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Admin access required'}),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        cur.execute("SELECT id, name, access_code, role, created_at FROM experts ORDER BY created_at DESC")
        experts = cur.fetchall()
        
        result = [{
            'id': e[0],
            'name': e[1],
            'access_code': e[2],
            'role': e[3],
            'created_at': e[4].isoformat() if e[4] else None
        } for e in experts]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        name = body_data.get('name', '').strip()
        
        if not name:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Name is required'}),
                'isBase64Encoded': False
            }
        
        access_code = generate_access_code()
        
        cur.execute(
            "INSERT INTO experts (name, access_code, role) VALUES (%s, %s, 'expert') RETURNING id, created_at",
            (name, access_code)
        )
        
        expert_id, created_at = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': expert_id,
                'name': name,
                'access_code': access_code,
                'role': 'expert',
                'created_at': created_at.isoformat() if created_at else None
            }),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }
