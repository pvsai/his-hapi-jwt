const Hapi        = require('@hapi/hapi');
const hapiAuthJWT = require('./node_modules/hapi-auth-jwt2/lib');
const JWT         = require('jsonwebtoken');  // used to sign our content
const port        = process.env.PORT || 3000; // allow port to be set


const secret = 'NeverShareYourSecret'; // Never Share This! even in private GitHub repos!

const people = {
    1: {
        eid: 1,
        username: 'user123',
        password: '1234',
        firstName: 'Jon',
        lastName: 'Doe',
        dob: '12/11/1991',
        email: 'user@gmail.com',
        address: {
            street: '555 Bayshore Blvd',
            city: 'Tampa',
            state: 'Florida',
            zip: '33813' 
        }
    }
}

// use the token as the 'authorization' header in requests
const token = JWT.sign(people[1], secret); // synchronous
console.log(token);

// bring your own validation function
const validate = async function (decoded, request, h) {
  console.log(" - - - - - - - decoded token:");
  console.log(decoded);
  console.log(" - - - - - - - request info:");
  console.log(request.info);
  console.log(" - - - - - - - user agent:");
  console.log(request.headers['user-agent']);

  // do your checks to see if the person is valid
  if (!people[decoded.eid]) {
    return { isValid: false };
  }
  else {
    return { isValid : true };
  }
};

const init = async() => {
    const server = new Hapi.Server({ port: port });

    await server.register(hapiAuthJWT);
    // see: http://hapijs.com/api#serverauthschemename-scheme
    server.auth.strategy('jwt', 'jwt',
    { 
        key: secret,
        validate,
        verifyOptions: { ignoreExpiration: true }
    });

    server.auth.default('jwt');

      // Route to simlate login and generate a JWT token and send
    server.route([
        {
            method: "POST", 
            config: { auth: false },
            path: '/user/login', 
            handler: function(request, response, next) {
                console.log("Payload : " + request.payload);
                const username = request.payload.username; //JSON.parse(request.payload);
                const password  = request.payload.password; //JSON.parse(request.payload);
                
                console.log("username: " + username + " password: " + password);
                //checking to make sure the user entered the correct username/password combo
                if(username === people[1].username && password === people[1].password) { 
                    //if user log in success, generate a JWT token for the user with a secret key
                    var token = JWT.sign(people[1], secret);
                    console.log("token: " + token);
                    //response.header("Authorization", token);
                    return { "token" : token };
                } 
                else {
                    console.log('ERROR: Could not log in');
                    return { "ERROR" : "Could not log in"};
                    // return h
                    //     .response(thisHTML)
                    //     .type('text/html')
                    //     .header('X-Custom', 'my-value')
                    //     .code(201)
                }
            }
        }
    ]);

    server.route([
        {
            method: "GET", path: "/", 
            config: { auth: false },
            handler: function(request, h) {
                return {text: 'Token not required'};
            }
        },
        {
            method: 'GET', 
            path: '/restricted', 
            config: { auth: 'jwt' },
            handler: function(request, h) {
                console.log("Validating JET token before accessing restricted content!");
                const response = h.response({message: 'You used a Valid JWT Token to access /restricted endpoint!'});
                response.header("Authorization", request.headers.authorization);
                return {text: "Accessed restricted content using JWT token."};
            }
        }
    ]);

    await server.start();
    console.log('Server running on %s', server.info.uri);  
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
