# Create Intermediate CA

openssl genrsa -aes256 -out intermediate/private/intermediate.key.pem 4096
openssl req -config openssl-in.cnf -passin "pass:cuongquay" -key intermediate/private/intermediate.key.pem -new -x509 -days 7300 -sha256 -extensions v3_ca -out intermediate/certs/intermediate.cert.pem
openssl x509 -noout -text -in intermediate/certs/intermediate.cert.pem
cat intermediate/certs/intermediate.cert.pem certs/ca.cert.pem > intermediate/certs/ca-chain.cert.pem