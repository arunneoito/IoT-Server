git add .
git commit -m "feat: google account linking"
git push origin main
ssh ubuntu@ec2-35-154-17-7.ap-south-1.compute.amazonaws.com <<-'ENDSSH'
 bash /home/ubuntu/IoTPlatform/deploy_iot.sh
ENDSSH
echo "deployment completed"
date
