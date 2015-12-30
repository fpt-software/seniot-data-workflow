CA_NAME=$1
PASSWORD=$2

mkdir -p ${CA_NAME}/
ROOTCA_CNF=${CA_NAME}/ca.cnf
TMP_FILE="./.tmp-auto"

cat ca.cnf | \
   	sed -e s=YOUR_COMMON_NAME=${CA_NAME}=g| \
   	sed -e s=ROOT_CERT_DIR=${CA_NAME}=g > $TMP_FILE;
cat $TMP_FILE > ${ROOTCA_CNF}

mkdir ${CA_NAME}/newcerts ${CA_NAME}/private
touch ${CA_NAME}/index.txt
echo 1000 > ${CA_NAME}/serial

openssl genrsa -passout "pass:${PASSWORD}" -aes256 -out ${CA_NAME}/ca-key.pem 4096
openssl req -config ${CA_NAME}/ca.cnf -passin "pass:${PASSWORD}" -key ${CA_NAME}/ca-key.pem -new -x509 -days 7300 -sha256 -extensions v3_ca -out ${CA_NAME}/ca-crt.pem
openssl x509 -noout -text -in ${CA_NAME}/ca-crt.pem