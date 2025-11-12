import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Save and retrieve expert ratings for submissions
    Args: event with httpMethod, body for POST with rating criteria
    Returns: HTTP response with rating data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Expert-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    database_url = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    if method == 'GET':
        query_params = event.get('queryStringParameters', {}) or {}
        submission_id = query_params.get('submission_id')
        
        if submission_id:
            cur.execute("""
                SELECT r.id, r.submission_id, r.expert_id, e.name,
                       r.informativeness, r.uniqueness, r.theme_compliance, 
                       r.regulation_compliance, r.total_score, r.comment, r.created_at
                FROM ratings r
                JOIN experts e ON r.expert_id = e.id
                WHERE r.submission_id = %s
                ORDER BY r.created_at DESC
            """, (submission_id,))
        else:
            cur.execute("""
                SELECT r.id, r.submission_id, r.expert_id, e.name,
                       r.informativeness, r.uniqueness, r.theme_compliance, 
                       r.regulation_compliance, r.total_score, r.comment, r.created_at
                FROM ratings r
                JOIN experts e ON r.expert_id = e.id
                ORDER BY r.created_at DESC
            """)
        
        ratings = cur.fetchall()
        
        result = [{
            'id': r[0],
            'submissionId': r[1],
            'expertId': r[2],
            'expertName': r[3],
            'informativeness': r[4],
            'uniqueness': r[5],
            'themeCompliance': r[6],
            'regulationCompliance': r[7],
            'totalScore': r[8],
            'comment': r[9],
            'createdAt': r[10].isoformat() if r[10] else None
        } for r in ratings]
        
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
        expert_id = headers.get('X-Expert-Id') or headers.get('x-expert-id')
        
        if not expert_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Expert ID required'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        
        submission_id = body_data.get('submission_id')
        informativeness = body_data.get('informativeness', 0)
        uniqueness = body_data.get('uniqueness', 0)
        theme_compliance = body_data.get('theme_compliance', 0)
        regulation_compliance = body_data.get('regulation_compliance', 0)
        comment = body_data.get('comment', '').strip()
        
        if not submission_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Submission ID required'}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            INSERT INTO ratings 
            (submission_id, expert_id, informativeness, uniqueness, theme_compliance, regulation_compliance, comment)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (submission_id, expert_id) 
            DO UPDATE SET
                informativeness = EXCLUDED.informativeness,
                uniqueness = EXCLUDED.uniqueness,
                theme_compliance = EXCLUDED.theme_compliance,
                regulation_compliance = EXCLUDED.regulation_compliance,
                comment = EXCLUDED.comment
            RETURNING id, total_score, created_at
        """, (submission_id, expert_id, informativeness, uniqueness, theme_compliance, regulation_compliance, comment))
        
        rating_id, total_score, created_at = cur.fetchone()
        
        cur.execute("UPDATE submissions SET status = 'reviewed' WHERE id = %s", (submission_id,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'id': rating_id,
                'submissionId': submission_id,
                'expertId': int(expert_id),
                'totalScore': total_score,
                'comment': comment,
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
