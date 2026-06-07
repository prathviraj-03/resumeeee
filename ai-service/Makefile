.PHONY: setup test up down

setup:
	@echo "Setting up virtual environment and dependencies..."
	python -m venv .venv
	.venv/Scripts/python -m pip install --upgrade pip
	.venv/Scripts/pip install -r requirements.txt
	.venv/Scripts/python -m spacy download en_core_web_lg || .venv/Scripts/python -m spacy download en_core_web_sm
	@if not exist .env copy .env.example .env

test:
	.venv/Scripts/pytest tests/ -v

up:
	docker-compose up --build -d

down:
	docker-compose down
