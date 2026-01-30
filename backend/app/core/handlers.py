from flask import jsonify
from pydantic import ValidationError as PydanticValidationError
from .exceptions import AppError

def register_error_handlers(app):
    
    @app.errorhandler(AppError)
    def handle_app_error(error):
        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(PydanticValidationError)
    def handle_pydantic_error(error):
        # Format pydantic errors nicely
        errors = []
        for e in error.errors():
            loc = ".".join(str(i) for i in e["loc"])
            errors.append({"field": loc, "message": e["msg"]})
        
        response = jsonify({"error": "Erro de validação", "details": errors})
        response.status_code = 422
        return response

    @app.errorhandler(404)
    def handle_404(error):
        return jsonify({"error": "Recurso não encontrado"}), 404

    @app.errorhandler(500)
    def handle_500(error):
        # In production, log this error propertly
        return jsonify({"error": "Erro interno do servidor"}), 500
