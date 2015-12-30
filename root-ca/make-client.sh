# Create Client Certificate
CA_NAME=$1
CA_PASSWORD=$2
CLIENT_ID=$3
PASSWORD=$4

CLIENT_CSR=${CLIENT_ID}/client-csr.pem
CLIENT_CRT=${CLIENT_ID}/client-crt.pem
CLIENT_KEY=${CLIENT_ID}/client-key.pem
CLIENT_CNF=${CLIENT_ID}/client.cnf

TMP_FILE="./.tmp-auto"

mkdir -p ${CLIENT_ID}

cat client.cnf | \
   	sed -e s=YOUR_COMMON_NAME=${CLIENT_ID}=g| \
   	sed -e s=ROOT_CERT_DIR=${CA_NAME}=g > $TMP_FILE;
cat $TMP_FILE > ${CLIENT_CNF}

openssl genrsa -passout "pass:${PASSWORD}" -out ${CLIENT_KEY} 2048
openssl req -new -config ${CLIENT_CNF} -extensions usr_cert -key ${CLIENT_KEY} -out ${CLIENT_CSR}
openssl ca -batch -config ${CLIENT_CNF} -passin "pass:${CA_PASSWORD}" -extensions usr_cert -notext -md sha256 -in ${CLIENT_CSR} -out ${CLIENT_CRT}
openssl verify -CAfile ${CA_NAME}/ca-crt.pem ${CLIENT_CRT}
openssl pkcs12 -passout "pass:${PASSWORD}" -export -out ${CLIENT_ID}/client.pfx -inkey ${CLIENT_KEY} -in ${CLIENT_CRT} -certfile ${CA_NAME}/ca-crt.pem