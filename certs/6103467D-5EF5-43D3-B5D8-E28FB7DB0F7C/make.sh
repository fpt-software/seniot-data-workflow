openssl genrsa -out client-key.pem 4096
openssl req -new -config client.cnf -key client-key.pem -out client-csr.pem
openssl x509 -req -extfile client.cnf -days 999 -passin "pass:password" -in client-csr.pem -CA ../ca-crt.pem -CAkey ../ca-key.pem -CAcreateserial -out client-crt.pem  