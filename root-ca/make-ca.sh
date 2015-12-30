# create Root CA
openssl genrsa -aes256 -out private/ca.key.pem 4096
openssl req -config openssl.cnf -passin "pass:cuongquay" -key private/ca.key.pem -new -x509 -days 7300 -sha256 -extensions v3_ca -out certs/ca.cert.pem
openssl x509 -noout -text -in certs/ca.cert.pem