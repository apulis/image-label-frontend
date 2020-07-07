import React, { Component } from 'react';
import { CRS } from 'leaflet';
import { Map, ImageOverlay, ZoomControl, Marker, CircleMarker, Popup } from 'react-leaflet';
import Control from 'react-leaflet-control';
import Hotkeys from 'react-hot-keys';
import update from 'immutability-helper';
import 'leaflet-path-drag';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'semantic-ui-react';
import { BBoxFigure, PolygonFigure } from '../Figure/index';
import { convertPoint, lighten, colorMapping } from '../utils';
import { withBounds, maxZoom } from '../CalcBoundsHOC';
import { Button, Input } from "antd";
import styles from './index.less';

class Canvas extends Component {
  constructor(props) {
    super(props);
    this.state = {
      zoom: 0,
      selectedFigureId: null,
      cursorPos: { lat: 0, lng: 0 },
      text: props.popup.popupText || ''
    };
    this.prevSelectedFigure = null;
    this.skipNextClickEvent = false;

    this.mapRef = React.createRef();
  }

  // componentDidUpdate(prevProps) {
  //   const { onSelectionChange, figures } = this.props;
  //   const { selectedFigureId } = this.state;

  //   if (this.prevSelectedFigureId !== selectedFigureId && onSelectionChange) {
  //     this.prevSelectedFigureId = selectedFigureId;
  //     onSelectionChange(selectedFigureId, figures.find(f => f.id === selectedFigureId));
  //   }
  // }
  componentDidMount() {
    const { onSelectionChange, figures } = this.props;
    const { selectedFigureId } = this.state;
    onSelectionChange(selectedFigureId, figures.find(f => f.id === selectedFigureId));
  }

  getSelectedFigure() {
    const { selectedFigureId } = this.state;
    const { figures } = this.props;
    return figures.find(f => f.id === selectedFigureId);
  }

  handleChange = (eventType, { point, pos, figure, points }) => {
    const { onChange, unfinishedFigure } = this.props;
    const drawing = !!unfinishedFigure;
    switch (eventType) {
      case 'add':
        if (drawing) {
          let newState = unfinishedFigure.points;
          newState = update(newState, { $push: [point] });

          onChange('unfinished',
            update(unfinishedFigure, {
              points: {
                $set: newState,
              },
            })
          );
        } else {
          onChange('replace',
            update(figure, { points: { $splice: [[pos, 0, point]] } })
          );
        }
        break;

      case 'end':
        const f = unfinishedFigure;
        onChange('new', f);
        break;

      case 'move':
        onChange('replace',
          update(figure, { points: { $splice: [[pos, 1, point]] } })
        );
        break;

      case 'replace':
        onChange('replace', update(figure, { points: { $set: points } }));
        break;

      case 'remove':
        onChange('replace',
          update(figure, { points: { $splice: [[pos, 1]] } })
        );
        break;

      default:
        throw new Error('unknown event type ' + eventType);
    }
  }

  handleClick = (e) => {
    const { unfinishedFigure } = this.props;
    const drawing = !!unfinishedFigure;
    console.log('drawing',drawing)
    if (this.skipNextClickEvent) {
      this.skipNextClickEvent = false;
      return;
    }
    if (drawing) {
      this.handleChange('add', { point: convertPoint(e.latlng) });
      return;
    }
    if (!drawing) {
      this.setState({ selectedFigureId: null });
      return;
    }
  }

  renderFigure(figure, options) {
    const Comp = figure.type === 'bbox' ? BBoxFigure : PolygonFigure;
    return (
      <Comp
        key={figure.id}
        figure={figure}
        options={options}
        skipNextClick={() => (this.skipNextClickEvent = true)}
        isOCR={this.props.isOCR}
      />
    );
  }

  changeState = (key, val) => {
    this.setState({ [key]: val });
  }

  render() {
    const {
      url,
      bounds,
      height,
      width,
      figures,
      unfinishedFigure,
      onChange,
      onReassignment,
      popup
    } = this.props;
    const { zoom, selectedFigureId, cursorPos, text } = this.state;
    const { popupShow, popupPoint, onPopupChange, popupText } = popup;
    const drawing = !!unfinishedFigure;
    const calcDistance = (p1, p2) => {
      const map = this.mapRef.current.leafletElement;
      return map.latLngToLayerPoint(p1).distanceTo(map.latLngToLayerPoint(p2));
    };
    const unfinishedDrawingDOM = drawing
      ? this.renderFigure(unfinishedFigure, {
        finished: false,
        editing: false,
        interactive: false,
        color: colorMapping[unfinishedFigure.color],
        onChange: this.handleChange,
        calcDistance,
        newPoint: cursorPos,
      })
      : null;

    const getColor = f =>
      f.tracingOptions && f.tracingOptions.enabled
        ? lighten(colorMapping[f.color], 80)
        : colorMapping[f.color];

    const figuresDOM = figures.map((f, i) =>
      this.renderFigure(f, {
        editing: selectedFigureId === f.id && !drawing,
        finished: true,
        interactive: !drawing,
        sketch: f.tracingOptions && f.tracingOptions.enabled,
        color: getColor(f),
        vertexColor: colorMapping[f.color],
        onSelect: () => {
          const { chnageLabelAppState } = this.props;
          this.setState({ selectedFigureId: `${f.id}` })
          chnageLabelAppState('selectedTreeKey', [`${f.id}`]);
        },
        onChange: this.handleChange,
        calcDistance,
      })
    );

    const hotkeysDOM = (
      <Hotkeys
        keyName="backspace,del,c,f,-,=,left,right,up,down"
        onKeyDown={key => {
          const tagName = document.activeElement
            ? document.activeElement.tagName.toLowerCase()
            : null;
          if (['input', 'textarea'].includes(tagName)) {
            return false;
          }
          if (drawing) {
            if (key === 'f') {
              const { type, points } = unfinishedFigure;
              if (type === 'polygon' && points.length >= 3) {
                this.handleChange('end', {});
              }
            }
          } else {
            if (key === 'c') {
              if (selectedFigureId && this.getSelectedFigure()) {
                onReassignment(this.getSelectedFigure().type);
              }
            } else if (key === 'backspace' || key === 'del') {
              if (selectedFigureId && this.getSelectedFigure()) {
                onChange('delete', this.getSelectedFigure());
              }
            }
          }

          const map = this.mapRef.current.leafletElement;
          if (key === 'left') {
            map.panBy([80, 0]);
          }
          if (key === 'right') {
            map.panBy([-80, 0]);
          }
          if (key === 'up') {
            map.panBy([0, 80]);
          }
          if (key === 'down') {
            map.panBy([0, -80]);
          }
          if (key === '=') {
            map.setZoom(map.getZoom() + 1);
          }
          if (key === '-') {
            map.setZoom(map.getZoom() - 1);
          }
        }}
      />
    );

    let renderedTrace = null;
    const selectedFigure = this.getSelectedFigure();
    if (selectedFigure && selectedFigure.type === 'polygon') {
      const trace = selectedFigure.tracingOptions
        ? selectedFigure.tracingOptions.trace || []
        : [];
      const figure = {
        id: 'trace',
        type: 'line',
        points: trace,
      };
      const traceOptions = {
        editing: false,
        finished: true,
        color: colorMapping[selectedFigure.color],
      };
      renderedTrace = <PolygonFigure figure={figure} options={traceOptions} />;
    }

    return (
      <div style={{ height: '100%', flex: 1 }} className={styles.canvasContentWrap}>
        <Map
          crs={CRS.Simple}
          zoom={zoom}
          minZoom={-50}
          maxZoom={maxZoom}
          center={[height / 2, width / 2]}
          zoomAnimation={false}
          zoomSnap={0.1}
          zoomControl={false}
          keyboard={false}
          attributionControl={false}
          onClick={this.handleClick}
          onZoom={e => this.setState({ zoom: e.target.getZoom() })}
          onMousemove={e => this.setState({ cursorPos: e.latlng })}
          ref={this.mapRef}
          className={drawing ? 'Crosshair' : 'Grab'}
        >
          <ZoomControl position="bottomright" />
          <Control className="leaflet-bar" position="bottomright">
            <a
              role="button"
              title="Zoom reset"
              href="#"
              onClick={() => {
                const map = this.mapRef.current.leafletElement;
                map.setView(map.options.center, map.options.zoom);
              }}
            >
              <Icon name="redo" fitted style={{ fontSize: '1.2em' }} />
            </a>
          </Control>
          <ImageOverlay url={url} bounds={bounds} />
          {popupShow && <Popup position={popupPoint} closeOnClick={false} closeButton={false}>
            <div>
              <Input placeholder="Please enter" value={text} onChange={e => this.setState({ text: e.target.value })} />
              <div className={styles.popupBtnWrap}>
                <Button type="primary" size="small" onClick={() => onPopupChange(1, text)}>确定</Button>
                <Button type="primary" size="small" onClick={() => onPopupChange(2)} style={{ margin: '0 10px' }}>取消</Button>
                <Button type="danger" size="small" onClick={() => onPopupChange(0)}>删除</Button>
              </div>
            </div>
          </Popup>}
          {unfinishedDrawingDOM}
          {/* {renderedTrace} */}
          {figuresDOM}
          {hotkeysDOM}
        </Map>
      </div>
    );
  }
}

export default withBounds(Canvas);
