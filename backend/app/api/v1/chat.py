from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ...services import process_chat_message

def register(parent: Blueprint) -> None:
    bp = Blueprint("chat", __name__)

    @bp.post("/chat")
    @jwt_required()
    def chat():
        data = request.json or {}
        message = data.get("message", "")
        if not message:
            return jsonify({"error": "Mensagem vazia"}), 400
        
        response_data = process_chat_message(message)
        # response_data is a dict with text, type, data, etc.
        # Ensure we return valid JSON
        return jsonify(response_data)

    parent.register_blueprint(bp)
