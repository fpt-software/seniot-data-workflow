# Revoke Client Certificate
CLIENT_ID=$1

CLIENT_CRT=clients/${CLIENT_ID}/client-crt.pem

openssl ca -config openssl-in.cnf -revoke ${CLIENT_CRT}
openssl ca -config openssl-in.cnf -gencrl -out intermediate/crl/intermediate.crl.pem
openssl crl -in intermediate/crl/intermediate.crl.pem -noout -text