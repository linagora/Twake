import Home from 'scenes/Login/Home/home.js';
import CreateAccount from 'scenes/Login/CreateAccount/createAccount.js';
import Login from 'scenes/Login/login.js';
import loginService from 'services/login/login.js';
import React from 'react';
import { mount } from 'enzyme';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { expect } from 'chai';
import constantsTest from './constantsTest';

class LoginTest {
  test() {
    configure({ adapter: new Adapter() });

    it('Login with bad login', done => {
      const HomeWrapper = mount(<Home />);
      HomeWrapper.setState({
        username: 'aze',
        password: 'aze',
      });
      HomeWrapper.find('button').simulate('submit');
      expect(loginService.login_loading).to.equal(true);
      setTimeout(function() {
        expect(loginService.login_loading).to.equal(false);
        expect(loginService.login_error).to.equal(true);
        expect(HomeWrapper.find('.ant-form-explain')).to.exist;
        done();
      }, constantsTest.apitTimeOut);
    });

    it('Login with good login', done => {
      const HomeWrapper = mount(<Home />);
      HomeWrapper.setState({
        username: 'benoit',
        password: 'Twakeapp.com1',
      });
      HomeWrapper.find('button').simulate('submit');
      expect(loginService.login_loading).to.equal(true);
      setTimeout(function() {
        expect(loginService.login_loading).to.equal(false);
        expect(loginService.state).to.equal('starting_app');
        done();
      }, constantsTest.apitTimeOut);
    });

    it('Check forgot/home/create button', () => {
      const LoginWrapper = mount(<Login />);

      LoginWrapper.find('#home .createAccount a').simulate('click');

      expect(LoginWrapper.find('#home').prop('style')).to.have.property('display', 'none');
      expect(LoginWrapper.find('#createAccount').prop('style')).to.not.have.property(
        'display',
        'none',
      );

      LoginWrapper.find('#createAccount button#back').simulate('click');

      expect(LoginWrapper.find('#createAccount').prop('style')).to.have.property('display', 'none');
      expect(LoginWrapper.find('#home').prop('style')).to.not.have.property('display', 'none');

      LoginWrapper.find('#home .login-form-forgot').simulate('click');
      expect(LoginWrapper.find('#forgotPassword').prop('style')).to.not.have.property(
        'display',
        'none',
      );
      expect(LoginWrapper.find('#home').prop('style')).to.have.property('display', 'none');
    });

    it('Create account step 1 next button disabled', () => {
      const CreateAccountWrapper = mount(<CreateAccount />);

      // verification si le username est null
      CreateAccountWrapper.setState({
        email: 'heho9876@yopmail.com',
        username: '',
        password: 'azeazeaze',
      });
      expect(CreateAccountWrapper.find('#next1 button').prop('disabled')).to.equal(true);

      // verification si le mail ne respecte pas le pattern
      CreateAccountWrapper.setState({
        email: 'a.b@c',
        username: 'benoit',
        password: 'azeazeaze',
      });
      expect(CreateAccountWrapper.find('#next1 button').prop('disabled')).to.equal(true);

      // verification si le password est trop court
      CreateAccountWrapper.setState({
        email: 'heho9876@yopmail.com',
        username: 'benoit',
        password: 'aze',
      });
      expect(CreateAccountWrapper.find('#next1 button').prop('disabled')).to.equal(true);

      // verification si tout marche étape 1
      CreateAccountWrapper.setState({
        email: 'heho9876@yopmail.com',
        username: 'heho9876',
        password: 'azeazeaze',
      });
      expect(CreateAccountWrapper.find('#next1 button').prop('disabled')).to.not.equal(true);
    });

    it('Create account step 1 with username already used', done => {
      const CreateAccountWrapper = mount(<CreateAccount />);
      CreateAccountWrapper.setState({
        email: 'heho9876.ijoajdiz@gmail.com',
        username: 'benoit',
        password: 'azeazeaze',
      });
      CreateAccountWrapper.find('#createAccount #next1 button').simulate('click');
      setTimeout(function() {
        expect(
          CreateAccountWrapper.find('#createAccount #errorUsernameExist').text(),
        ).to.not.be.empty;
        done();
      }, constantsTest.apitTimeOut);
    });

    it('Create account step 1 with mail already used', done => {
      const CreateAccountWrapper = mount(<CreateAccount />);
      CreateAccountWrapper.setState({
        email: 'benoit.tallandier@gmail.com',
        username: 'benoiezaezat',
        password: 'azeazeaze',
      });
      CreateAccountWrapper.find('#createAccount #next1 button').simulate('click');
      setTimeout(function() {
        expect(CreateAccountWrapper.find('#createAccount #errorMailExist').text()).to.not.be.empty;
        done();
      }, constantsTest.apitTimeOut);
    });
  }
  login() {
    loginService.login(constantsTest.realUserAccount, constantsTest.realPasswordAccount, true);
  }
}
var log = new LoginTest();
export default log;
