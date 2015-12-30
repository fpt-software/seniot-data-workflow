openssl ca -config openssl-in.cnf -passin "pass:cuongquay" -gencrl -out intermediate/crl/intermediate.crl.pem
openssl crl -in intermediate/crl/intermediate.crl.pem -noout -text