import fs from 'fs';
import https from 'https';

const url = 'https://media1.tenor.com/m/0iS98P38V_0AAAAd/brad-pitt.gif';

https.get(url, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    https.get(res.headers.location, (res2) => {
      res2.pipe(fs.createWriteStream('d:/askit/public/brad-pitt.gif'));
      console.log('Downloaded redirected gif');
    });
  } else {
    res.pipe(fs.createWriteStream('d:/askit/public/brad-pitt.gif'));
    console.log('Downloaded gif');
  }
});
