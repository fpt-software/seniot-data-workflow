# Create Client Certificate
CLIENT_ID=$1
CLIENT_CSR=clients/${CLIENT_ID}/client-csr.pem
CLIENT_CRT=clients/${CLIENT_ID}/client-crt.pem
CLIENT_KEY=clients/${CLIENT_ID}/client-key.pem
CLIENT_CNF=clients/${CLIENT_ID}/client.cnf
TMP_FILE="./.tmp-auto"

mkdir -p clients/${CLIENT_ID}
openssl genrsa -out ${CLIENT_KEY} 2048

cat client.cnf | \
   	sed -e s=AUTO_CLIENT_ID=${CLIENT_ID}=g| \
   	sed -e s=YOUR_CLIENT_ID=${CLIENT_ID}=g > $TMP_FILE;
cat $TMP_FILE > ${CLIENT_CNF}

openssl req -new -config ${CLIENT_CNF} -extensions usr_cert -key ${CLIENT_KEY} -out ${CLIENT_CSR}
openssl ca -batch -config ${CLIENT_CNF} -passin "pass:cuongquay" -extensions usr_cert -notext -md sha256 -in ${CLIENT_CSR} -out ${CLIENT_CRT}
openssl verify -CAfile intermediate/certs/ca-chain.cert.pem ${CLIENT_CRT}