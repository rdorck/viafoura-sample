window.addEventListener('load', () => {
  let content = document.querySelector('.content');
  let spinner = document.getElementById('loading');

  content.style.display = 'block';
  spinner.style.display = 'none';

  var userProfile;
  var apiUrl = 'http://localhost:3001/api';
  var requestedScopes = 'openid profile read:messages write:messages';

  // Initialize Auth0 object
  var webAuth = new auth0.WebAuth({
    domain: AUTH0_DOMAIN,
    clientID: AUTH0_CLIENT_ID,
    redirectUri: AUTH0_CALLBACK_URL,
    audience: "https://" + AUTH0_DOMAIN + '/userinfo',
    responseType: "token id_token",
    scope: requestedScopes,
    leeway: 60
  });

  let dialog = document.querySelector('dialog');

  let homeView = document.getElementById('home-view');
  let loginView = document.getElementById('login-view');
  let commentsView = document.getElementById('comments-view');
  let profileView = document.getElementById('profile-view');

  let homeBtn = document.getElementById('btn-home');
  let signupBtn = document.getElementById('btn-signup');
  let loginBtn = document.getElementById('btn-login');
  let logoutBtn = document.getElementById('btn-logout');
  let profileBtn = document.getElementById('btn-profile');

  commentsView.style.display = 'none';

  // Home Listener
  homeBtn.addEventListener('click', () => {
    profileView.style.display = 'none';
    loginView.style.display = 'none';
    homeView.style.display = 'inline-block';
  });

  // Signup Listener
  signupBtn.addEventListener('click', event => {
    event.preventDefault();
    spinner.style.display = 'inline-block';

    signup();
  });

  // Profile Listener
  profileBtn.addEventListener('click', () => {
    loginView.style.display = 'none';
    profileView.style.display = 'inline-block';

    getUserProfile();
  });

  // Login Listener
  loginBtn.addEventListener('click', login());

  // Logout Listener
  logoutBtn.addEventListener('click', logout());

  // Signup
  function signup () {
    webAuth.signup({
      connection: 'Username-Password-Authentication',
      email: document.getElementById('email').val(),
      password: document.getElementById('pwd').val()
    }, function (err) {
      if (err) {
        return swal({
          type: 'error',
          text: err.message
        });
      }

      return swal({
        type: 'success',
        text: 'Successfully created an account!'
      });
    });
  }

  // Login with Auth0
  function login () {
    webAuth.authorize();
  }

  /**
   * Sets localStorage Cookie for Auth0 session
   *
   * @param authResult
   */
  function setSession (authResult) {
    var expiresAt = JSON.stringify(
      authResult.expiresIn * 1000 + new Date().getTime()
    );

    /*
     * If there is a value on the `scope` param from the authResult,
     * use it to set scopes in the session for the user. Otherwise
     * use the scopes as requested. If no scopes were requested,
     * set it to nothing
     */
    const scopes = authResult.scope || requestedScopes || '';

    localStorage.setItem('access_token', authResult.accessToken);
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('expires_at', expiresAt);
    localStorage.setItem('scopes', JSON.stringify(scopes));
  }

  // Removes localStorage set by Auth0
  function logout () {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('scopes');

    display();
  }

  // Call to get user profile and display
  function getUserProfile () {
    if (!userProfile) {
      var accessToken = localStorage.getItem('access_token');

      if (!accessToken) {
        swal({
          type: 'warning',
          title: 'Missing Data',
          text: 'Access token must exist to fetch user profile'
        });
      }

      webAuth.client.userInfo(accessToken, (err, profile) => {
        if (profile) {
          userProfile = profile;
          displayProfile();
        }
      });
    } else {
      displayProfile();
    }
  }

  /**
   * Verifies expires_at Auth0 token
   *
   * @returns {boolean}
   */
  function isAuthenticated () {
    var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    return new Date().getTime() < expiresAt;
  }

  // Handles actual authentication via Auth0
  function authenticate () {
    webAuth.parseHash((error, authResult) => {

      if (authResult && authResult.accessToken && authResult.idToken) {
        swal({
          type: 'success',
          text: 'User is authenticated'
        });

        window.location.hash = '';
        console.log(authResult);

        //dialog.close(); // closes authentication dialog
        setSession(authResult); // sets localStorage

        homeView.style.display = 'inline-block';
        //logoutBtn.style.display = 'inline-block';
        //commentsView.style.display = 'inline-block';
      } else if (error) {
        //dialog.showModal();
        homeView.style.display = 'inline-block';
        loginView.style.display = 'inline-block';
        console.log(error);

        swal({
          type: 'error',
          title: 'Authentication Error',
          text: 'There was a problem authenticating given user'
        });
      }
    });
  }

  // Style Login form depending on authentication status
  function display () {
    var status = document.querySelector('#status');

    if (isAuthenticated()) {
      status.innerHTML = 'You are logged in!';
    } else {
      status.innerHTML = 'Please login to access your account';
    }

    if (!isAuthenticated || !userHasScopes(['write:messages'])) {
      commentsView.style.display = 'none';
    } else {
      commentsView.style.display = 'inline-block';
    }
  }

  // Displays profile-view populated with user data
  function displayProfile () {
    document.querySelector('#profile-view .nickname')
      .innerHTML = userProfile.nickname;

    document.querySelector('#profile-view .full-profile')
      .innerHTML = JSON.stringify(userProfile, null, 2);

    document.querySelector('#profile-view img')
      .src = userProfile.picture;
  }

  /**
   * Verifies users allowed scopes
   *
   * @param scopes
   * @returns {boolean}
   */
  function userHasScopes(scopes) {
    var savedScopes = JSON.parse(localStorage.getItem('scopes'));
    if (!savedScopes) return false;
    var grantedScopes = savedScopes.split(' ');
    for (var i = 0; i < scopes.length; i++) {
      if (grantedScopes.indexOf(scopes[i]) < 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Make API call to Auth0
   * 
   * @param endpoint
   * @param secured
   * @param method
   * @param callback
   */
  function authAPI (endpoint, secured, method, callback) {
    var url = apiUrl + endpoint;
    var xhr = new XMLHttpRequest();

    xhr.open(method, url);

    if (secured) {
      xhr.setRequestHeader(
        'Authorization',
        'Bearer ' + localStorage.getItem('access_token')
      );
    }

    xhr.onload = function () {
      if (xhr.status == 200) {
        var message = JSON.parse(xhr.responseText).message;
        callback(null, message);
      } else {
        callback(xhr.statusText);
      }
    }

    xhr.send();
  }

  authenticate();
  display();
});