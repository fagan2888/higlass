/* eslint-env node, jasmine, mocha */
import {
  configure,
  // render,
} from 'enzyme';

import Adapter from 'enzyme-adapter-react-16';

import { expect } from 'chai';

// Utils
import {
  some,
  waitForTransitionsFinished,
  waitForTilesLoaded,
} from '../app/scripts/utils';

import {
  simpleCenterViewConfig,
  simple1And2dAnnotations,
} from './view-configs';

import {
  viewer
} from '../app/scripts/hglib';

configure({ adapter: new Adapter() });

function findCanvas(element) {
  if (element.tagName.toLowerCase() === 'canvas') return element;
  let canvas;
  some((childElement) => {
    const el = findCanvas(childElement);
    if (el) {
      canvas = el;
      return true;
    }
    return false;
  })(element.children);
  return canvas;
}

function createElementAndAPI(viewConfig, options) {
  const div = global.document.createElement('div');
  global.document.body.appendChild(div);

  div.setAttribute('style', 'width:600px; height: 400px; background-color: lightgreen');

  const api = viewer(div, viewConfig, options);

  return [div, api];
}

describe('Simple HiGlassComponent', () => {
  let div = null;
  let api = null;

  describe('Options tests', () => {
    it('creates an editable component', () => {
      ([div, api] = createElementAndAPI(simpleCenterViewConfig));

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).to.be.above(0);
    });

    it('zooms to negative domain', (done) => {
      ([div, api] = createElementAndAPI(simpleCenterViewConfig,
        { editable: false }));

      api.zoomTo('a', 6.069441699652629, 6.082905691828387,
        -23.27906532393644, -23.274695776773807, 100);

      waitForTransitionsFinished(api.getComponent(), () => {
        expect(api.getComponent().yScales.a.domain()[0]).to.be.below(0);
        done();
      });
    });

    it('zooms to just x and y', (done) => {
      ([div, api] = createElementAndAPI(simpleCenterViewConfig,
        { editable: false }));

      api.zoomTo('a', 6.069441699652629, 6.082905691828387, null, null, 100);

      waitForTransitionsFinished(api.getComponent(), () => {
        waitForTilesLoaded(api.getComponent(), () => {
          expect(api.getComponent().yScales.a.domain()[0]).to.be.above(2);

          const trackObj = api.getTrackObject('a', 'heatmap1');

          const rd = trackObj.getVisibleRectangleData(285, 156, 11, 11);
          expect(rd.data.length).to.eql(1);

          done();
        });
      });
    });

    it('zoom to a nonexistent view', () => {
      // complete me, should throw an error rather than complaining
      // "Cannot read property 'copy' of undefined thrown"
      ([div, api] = createElementAndAPI(simpleCenterViewConfig,
        { editable: false }));

      expect(() => api.zoomTo('nonexistent', 6.069441699652629, 6.082905691828387,
        -23.274695776773807, -23.27906532393644))
        .to.throw('Invalid viewUid. Current present uuids: a');
    });

    it('creates a non editable component', () => {
      ([div, api] = createElementAndAPI(simpleCenterViewConfig,
        { editable: false }));

      const component = api.getComponent();

      expect(Object.keys(component.viewHeaders).length).to.eql(0);
    });

    it('retrieves a track', () => {
      ([div, api] = createElementAndAPI(simpleCenterViewConfig,
        { editable: false }));

      const viewconf = api.getViewConfig();
      const trackObj = api.getTrackObject(viewconf.views[0].tracks.center[0].uid);

      expect(trackObj).to.exist; // eslint-disable-line no-unused-expressions
    });

    it('zooms to a negative location', (done) => {
      ([div, api] = createElementAndAPI(simpleCenterViewConfig,
        { editable: false, bounded: true }));

      api.zoomTo('a', -10000000, 10000000);

      waitForTransitionsFinished(api.getComponent(), () => {
        waitForTilesLoaded(api.getComponent(), () => {
          done();
        });
      });
    });

    // Fritz: This test fails but if you comment out all the other tests it will
    // succeed!? Also, if you move this test to the top it will succeed but
    // tests number 3, 4, and 6 will fail all of a sudden! Therefore, I assume
    // the test itself work just fine but there's something fundamentally broken
    // with our test setup or with HG. Either way, the HG instances must have
    // some shared state that influences each other. I am giving up for now but
    // we need to look into this again.
    it('listens to click events', (done) => {
      [div, api] = createElementAndAPI(
        simple1And2dAnnotations,
        { editable: false, bounded: true }
      );

      const canvas = findCanvas(div);

      let clicked = 0;

      api.on('click', () => { clicked++; });

      const createPointerEvent = (type, x, y) => new PointerEvent(type, {
        view: window,
        bubbles: true,
        cancelable: true,
        // WARNING: The following property is absolutely crucial to have the
        // event being picked up by PIXI. Do not remove under any circumstances!
        pointerType: 'mouse',
        screenX: x,
        screenY: y,
        clientX: x,
        clientY: y
      });

      setTimeout(() => {
        canvas.dispatchEvent(createPointerEvent('pointerdown', 100, 100));
        canvas.dispatchEvent(createPointerEvent('pointerup', 100, 100));
      }, 0);

      waitForTilesLoaded(api.getComponent(), () => {
        setTimeout(() => {
          canvas.dispatchEvent(createPointerEvent('pointerdown', 100, 200));
          canvas.dispatchEvent(createPointerEvent('pointerup', 100, 200));
        }, 0);

        setTimeout(() => {
          expect(clicked).to.equal(2);

          done();
        }, 0);
      });
    });

    afterEach(() => {
      if (api) {
        api.destroy();
        api = undefined;
      }
      if (div) {
        document.body.removeChild(div);
        div = undefined;
      }
    });

    // it('creates a new component with different options and checks'
    //   + 'whether the global options object of the first object has changed', () => {
    //   // create one div and set an auth header
    //   const div = global.document.createElement('div');
    //   global.document.body.appendChild(div);

    //   const api = viewer(div, simpleCenterViewConfig, { a: 'x' });

    //   api.setViewConfig(simpleCenterViewConfig);
    //   api.setAuthHeader('blah');

    //   // create a second component and set a different auth header
    //   const div1 = global.document.createElement('div');
    //   global.document.body.appendChild(div1);

    //   const api1 = viewer(div1, simpleCenterViewConfig, { a: 'y' });
    //   api1.setAuthHeader('wha');

    //   // check to make sure that the two components have different
    //   // auth headers
    // });
  });
});