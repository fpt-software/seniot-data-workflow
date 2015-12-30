# Create Server Certificate

openssl genrsa -aes256 -out intermediate/private/server-key.pem 2048
openssl req -config openssl-in.cnf -passin "pass:cuongquay" -key intermediate/private/server-key.pem -new -sha256 -out intermediate/csr/server-csr.pem
openssl ca -config openssl-in.cnf -passin "pass:cuongquay" -extensions server_cert -days 375 -notext -md sha256 -in intermediate/csr/server-csr.pem -out intermediate/certs/server-cert.pem
openssl x509 -noout -text -in intermediate/certs/server-cert.pem
openssl verify -CAfile intermediate/certs/ca-chain.cert.pem intermediate/certs/server-cert.pem