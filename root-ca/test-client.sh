./make-client.sh FSOFTCA "fptsoftware" $1 "fptlennox"
cp -r $1 /home/centos/api.go4smac.com/
./make-crl.sh FSOFTCA "fptsoftware"
cp FSOFTCA/ca-crl.pem /home/centos/api.go4smac.com/
