# Create Server Certificate
CA_NAME=$1
CA_PASSWORD=$2
SERVER_NAME=$3
SERVER_PASSWORD=$4

mkdir -p ${SERVER_NAME}/
SERVER_CNF=${SERVER_NAME}/server.cnf
ROOTCA_CNF=${CA_NAME}/ca.cnf
TMP_FILE="./.tmp-auto"

cat ca.cnf | \
   	sed -e s=YOUR_COMMON_NAME=${SERVER_NAME}=g| \
   	sed -e s=ROOT_CERT_DIR=${SERVER_NAME}=g > $TMP_FILE;
cat $TMP_FILE > ${SERVER_CNF}
echo ${SERVER_PASSWORD} > ${SERVER_NAME}/server-crt.pass

openssl genrsa -passout "pass:${SERVER_PASSWORD}" -aes256 -out ${SERVER_NAME}/server-key.pem 2048
openssl req -config ${SERVER_CNF} -passin "pass:${SERVER_PASSWORD}" -key ${SERVER_NAME}/server-key.pem -new -sha256 -out ${SERVER_NAME}/server-csr.pem
openssl ca -batch -config ${ROOTCA_CNF} -passin "pass:${CA_PASSWORD}" -extensions server_cert -days 375 -notext -md sha256 -in ${SERVER_NAME}/server-csr.pem -out ${SERVER_NAME}/server-crt.pem
openssl x509 -noout -text -in ${SERVER_NAME}/server-crt.pem
openssl verify -CAfile ${CA_NAME}/ca-crt.pem ${SERVER_NAME}/server-crt.pem