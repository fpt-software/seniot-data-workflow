CA_NAME=$1
CA_PASSWORD=$2

ROOTCA_CRL=${CA_NAME}/crl/ca-crl.pem
ROOTCA_CNF=${CA_NAME}/ca.cnf

openssl ca -batch -config ${ROOTCA_CNF} -passin "pass:${CA_PASSWORD}" -gencrl -out ${ROOTCA_CRL}
openssl crl -in ${ROOTCA_CRL} -noout -text