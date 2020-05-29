import { configure, addParameters } from '@storybook/react';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

addParameters({
  options: {
    name: "Twake Storybook",
    sortStoriesByKind: true
  }
})

// automatically import all files ending in *.stories.js
const req = require.context('../stories', true, /\.stories\.js$/);
function loadStories() {
  req.keys().forEach(filename => req(filename));
}

Enzyme.configure({ adapter: new Adapter() });
configure(loadStories, module);
