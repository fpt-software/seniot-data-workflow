openssl genrsa -out client-key.pem 4096
openssl req -new -config client.cnf -key client-key.pem -out client-csr.pem