import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage submissions - create, list, update
    Args: event with httpMethod, body for POST/PUT, queryStringParameters for GET
    Returns: HTTP response with submission data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Code',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        cur.execute("""
            SELECT s.id, s.participant_name, s.team_name, s.category, s.submission_type,
                   s.title, s.content, s.video_url, s.status, s.created_at,
                   COALESCE(AVG(r.total_score), 0) as avg_score
            FROM submissions s
            LEFT JOIN ratings r ON s.id = r.submission_id
            GROUP BY s.id
            ORDER BY s.created_at DESC
        """)
        
        submissions = cur.fetchall()
        
        result = [{
            'id': s[0],
            'participant': s[1],
            'team': s[2],
            'category': s[3],
            'type': s[4],
            'title': s[5],
            'content': s[6],
            'videoUrl': s[7],
            'status': s[8],
            'createdAt': s[9].isoformat() if s[9] else None,
            'avgScore': float(s[10]) if s[10] else 0
        } for s in submissions]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    if method == 'POST':
        headers = event.get('headers', {})
        admin_code = headers.get('X-Admin-Code') or headers.get('x-admin-code')
        
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
        
        body_data = json.loads(event.get('body', '{}'))
        
        participant_name = body_data.get('participant_name', '').strip()
        team_name = body_data.get('team_name', '').strip()
        category = body_data.get('category', '').strip()
        submission_type = body_data.get('submission_type', '').strip()
        title = body_data.get('title', '').strip()
        content = body_data.get('content', '').strip()
        video_url = body_data.get('video_url', '').strip()
        
        if not all([participant_name, submission_type, title, content]):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            INSERT INTO submissions 
            (participant_name, team_name, category, submission_type, title, content, video_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (participant_name, team_name, category, submission_type, title, content, video_url or None))
        
        submission_id, created_at = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': submission_id,
                'participant': participant_name,
                'team': team_name,
                'category': category,
                'type': submission_type,
                'title': title,
                'content': content,
                'videoUrl': video_url,
                'status': 'pending',
                'createdAt': created_at.isoformat() if created_at else None
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
