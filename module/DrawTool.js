import * as THREE from 'three';
const lineMaterial = new THREE.LineBasicMaterial({
	color: 0x0000ff
});
export default class DrawTool {
    constructor(renderer, camera, options ={ size: 1000 }) {
        this._renderer = renderer;
        this._pointer = new THREE.Vector2();
        this._enable = true;
        this._status = 'idle';
        this._camera = camera;
        this._raycaster = new THREE.Raycaster();
        this._raycaster.setFromCamera(this._pointer, this._camera);
        this._lineGroup = new THREE.Object3D();
        this._startPoint = null;
        this._points = [];
        this._isMouseUp = true;
        this._eventMap = {};
        this._target = null;
        this._registerMouseEventForRenderer();
    }

    setTarget(object3d) {
        this._target = object3d;
    }

    enable() {
        this._enable = true;
    }

    disable() {
        this._enable = false;
    }

    getLine() {
        return this._lineGroup;
    }

    addTo(scene) {
        this.scene = scene;
        this.scene.add(this._lineGroup);
    }

    remove() {
        this.scene.remove(this._lineGroup);
        this._renderer.domElement.removeEventListener('mousedown', this._onMouseDown.bind(this));
        this._renderer.domElement.removeEventListener('mousemove', this._onMouseMove.bind(this));
        this._renderer.domElement.removeEventListener('mouseup', this._onMouseUp.bind(this));
        this._renderer.domElement.removeEventListener('dblclick', this._onMouseDblClick.bind(this));
        delete this.scene;
        delete this._renderer;
        delete this._eventMap;
    }

    on(eventName, callback) {
        if (!this._eventMap[eventName]) {
            this._eventMap[eventName] = [];
        }
        this._eventMap[eventName].push(callback);
    }

    off(eventName, callback) {
        if (!this._eventMap[eventName]) {
            return;
        }
        this._eventMap[eventName] = this._eventMap[eventName].filter(cb => cb !== callback);
    }

    emit(eventName, ...args) {
        if (!this._eventMap[eventName]) {
            return;
        }
        this._eventMap[eventName].forEach(cb => cb(...args));
    }

    _getIntersects(event) {
        this._pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        this._pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
        this._raycaster.setFromCamera(this._pointer, this._camera);
        const intersects = this._raycaster.intersectObjects(this._target);
        return intersects;
    }

    _registerMouseEventForRenderer() {
        this._renderer.domElement.addEventListener('mousedown', this._onMouseDown.bind(this));
        this._renderer.domElement.addEventListener('mousemove', this._onMouseMove.bind(this));
        this._renderer.domElement.addEventListener('mouseup', this._onMouseUp.bind(this));
        this._renderer.domElement.addEventListener('dblclick', this._onMouseDblClick.bind(this));
    }

    _updateLine(point) {
        const array = new Float32Array((this._points.length + 1) * 3);
        for (let i = 0; i < this._points.length; i++) {
            array[i * 3] = this._points[i].x;   
            array[i * 3 + 1] = this._points[i].y;
            array[i * 3 + 2] = this._points[i].z;
        }
        array[this._points.length * 3] = point.x;
        array[this._points.length * 3 + 1] = point.y;
        array[this._points.length * 3 + 2] = point.z;
        const posAttr = new THREE.BufferAttribute( array, 3 );
        posAttr.usage = THREE.DynamicDrawUsage;
        this._currentLine.geometry.setAttribute( 'position',  posAttr);
    }

    _onMouseDown(event) {
        if (!this.scene || event.button !== 0) {
            return;
        }
        if (!this._enable) return;
        if (!this._target)  return;
        this._isMouseUp = false;
        const intersects = this._getIntersects(event);
        if (intersects.length) {
            this._status = 'startdrawing';
            if (this._points.length === 0) {//首次点击
                this._startPoint = intersects[0].point;
                const geometry = new THREE.BufferGeometry().setFromPoints([this._startPoint]);
                const line = new THREE.Line(geometry, lineMaterial);
                const posAttr = line.geometry.attributes.position;
                posAttr.setXYZ(0, this._startPoint.x, this._startPoint.y, this._startPoint.z);
                this._lineGroup.add(line);
                this._currentLine = line;
                this._points.push(this._startPoint);
            } else if (this._points.length > 0) {//再次点击
                this._updateLine(intersects[0].point);
                this._points.push(intersects[0].point);
            }
        }
    }

    _onMouseMove(event) {
        if (!this.scene || event.button !== 0) {
            return;
        }
        if (this._status !== 'startdrawing' || !this._enable) return;
        if (!this._target)  return;
        if (!this._isMouseUp && this._points.length < 2) {
            this._endDraw();
            return;
        }
        const intersects = this._getIntersects(event);
        if (intersects.length) {
            this._updateLine(intersects[0].point);
        }
    }

    _onMouseUp(event) {
        if (!this.scene || event.button !== 0) {
            return;
        }
        if (!this._target)  return;
        this._isMouseUp = true;
    }

    _onMouseDblClick(event) {
        if (!this.scene || event.button !== 0) {
            return;
        }
        if (!this._target)  return;
        if (this._status !== 'startdrawing' || !this._enable) return;
        this.emit('drawend', { line: this._currentLine });
        this._endDraw();
    }

    _endDraw() {
        this._status = 'idle';
        this._currentLine = null;
        this._points = [];
        this._startPoint = null;
    }
}