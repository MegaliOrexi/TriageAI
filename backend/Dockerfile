FROM python:3.13.2-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Default command (can be overridden by docker-compose)
CMD ["python", "main.py"]
