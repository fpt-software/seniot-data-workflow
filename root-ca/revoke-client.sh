# Revoke Client Certificate
CLIENT_ID=$1
PASSWORD=$2
CA_NAME=$3
CA_PASSWORD=$4

CLIENT_CRT=${CLIENT_ID}/client-crt.pem
ROOTCA_CNF=${CA_NAME}/ca.cnf

openssl ca -batch -config ${ROOTCA_CNF} -passin "pass:${CA_PASSWORD}" -revoke ${CLIENT_CRT}
openssl ca -batch -config ${ROOTCA_CNF} -passin "pass:${CA_PASSWORD}" -gencrl -out ${CA_NAME}/ca-crl.pem
openssl crl -in ${CA_NAME}/ca-crl.pem -noout -text