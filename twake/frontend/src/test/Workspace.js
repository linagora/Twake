import React from 'react';
import { mount } from 'enzyme';
import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import constant from '../client/constants.js';
import { expect } from 'chai';
import $ from 'jquery';

import App from 'scenes/App/app.js';
import Workspaces from 'scenes/App/LeftSidebar/workspaces/workspaces.js';
import AddWorkspace from 'components/AddWorkspace/AddWorkspace.js';

import constantsTest from './constantsTest';
import login from './Login.js';

class WorkspaceTest {
  test() {
    configure({ adapter: new Adapter() });

    // it('Open Workspace Modal', done => {
    //     login.login();
    //     setTimeout(function(){
    //         const AppWrapper = mount(<App />);
    //         setTimeout(function(){
    //             expect(AppWrapper.find(AddWorkspace).state().visible).to.not.be.equal(true);
    //             AppWrapper.find('#AddWorkspaceButton').first().simulate('click');
    //             expect(AppWrapper.find(AddWorkspace).state().visible).to.be.equal(true);
    //             done();
    //         },1000);
    //     },100);
    // });
    it('Check element enabled', done => {
      login.login();
      setTimeout(function() {
        const AppWrapper = mount(<App />);
        setTimeout(function() {
          expect(AppWrapper.find(AddWorkspace).state().visible).to.not.be.equal(true);
          AppWrapper.find('#AddWorkspaceButton')
            .first()
            .simulate('click');

          //test initial name
          expect(AppWrapper.find(AddWorkspace).state().workspace_name).to.be.equal('Marketing');

          //button "next" disabled if no name for workspace
          expect(
            AppWrapper.find('.modalCreateWorkspace #nextStep1')
              .first()
              .prop('disabled'),
          ).to.not.be.equal(true);
          AppWrapper.find(AddWorkspace).setState({ workspace_name: '' });
          expect(
            AppWrapper.find('.modalCreateWorkspace #nextStep1')
              .first()
              .prop('disabled'),
          ).to.be.equal(true);

          // show group selector if new group checked
          expect(
            AppWrapper.find('#newGroupCheckBox')
              .first()
              .prop('checked'),
          ).to.be.equal(true);
          expect(AppWrapper.exists('#selectExistingGroup')).to.be.equal(false);
          AppWrapper.find(AddWorkspace).setState({ group_id: 1 });
          expect(
            AppWrapper.find('#newGroupCheckBox')
              .first()
              .prop('checked'),
          ).to.be.equal(false);
          expect(AppWrapper.exists('#selectExistingGroup')).to.be.equal(true);
          // expect(AppWrapper.exists("#selectExistingGroup").).to.be.equal(true);
          done();
        }, 1000);
      }, 100);
    });
  }
}
var ws = new WorkspaceTest();
export default ws;
