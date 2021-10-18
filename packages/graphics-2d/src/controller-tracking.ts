import { ShapeCreateController } from './controller';
import { RectangleCreateController } from './controller-rectangle';
import { Tracker } from '@pixano/ai/lib/tracker';
import { GraphicRectangle } from './graphics';

/**
 * Inherit ShapeCreateController to handle creation of rectangle shapes.
 */
export class TrackingSmartController extends RectangleCreateController {

    nextFrame: () => any;

    private tracker = new Tracker();
	private Box2Track: [number, number, number, number] = [0,0,0,0];

    constructor(props: Partial<TrackingSmartController>) {
        super(props);
        this.nextFrame = props.nextFrame || (() => {});
		this.Box2Track = [0,0,0,0];
    }

    bindings() {
        super.bindings();
        this.keyBindings = this.keyBindings.bind(this);
    }

    activate() {
        super.activate();
        if (!this.tracker.isLoaded()) this.tracker.loadModel().then(() => console.info('Model loaded'));
		console.log("activate")
        window.addEventListener('keydown', this.keyBindings)
    }

    deactivate() {
		console.log("deactivate")
        super.deactivate();
        window.removeEventListener('keydown', this.keyBindings);
    }

    keyBindings(e: KeyboardEvent) {
        if (e.key === 'n') {
			console.log("n")
            this.track(this.Box2Track[0],this.Box2Track[1],this.Box2Track[2],this.Box2Track[3]);
        }
    }

    track(xmin: number,ymin: number,xmax: number,ymax: number) {
        // apply tracking
        // const shape = this.targetShapes.values().next().value;
		// console.log("shape=",this.targetShapes.values().next().value)
		// console.log("next=",this.targetShapes.values().next())
		// console.log("values=",this.targetShapes.values())
		// console.log("tshape=",this.targetShapes)
        // if (!shape) {
        //     return;
        // }
        const im0 = this.renderer.image;
        const x = Math.round(xmin*this.renderer.imageWidth);
        const y = Math.round(ymin*this.renderer.imageHeight);
        const w = Math.round(xmax*this.renderer.imageWidth) - x;
        const h = Math.round(ymax*this.renderer.imageHeight) - y;
		console.log("in=",x,y,w,h)
        this.tracker.initBox(im0, x, y, w, h);
        this.nextFrame().then(() => {
            const im1 = this.renderer.image;
            var res = this.tracker.run(im1);
			console.log("res=",res)
			this.Box2Track = [Math.trunc(res[0]),Math.trunc(res[1]),Math.trunc(res[2]),Math.trunc(res[3])];

            const target = this.targetShapes.values().next().value;
            target.geometry.vertices = [
                res[0]/this.renderer.imageWidth,
                res[1]/this.renderer.imageHeight,
                (res[0]+res[2])/this.renderer.imageWidth,
                (res[1]+res[3])/this.renderer.imageHeight
            ]
			this.Box2Track = [res[0]/this.renderer.imageWidth,res[1]/this.renderer.imageHeight,(res[0]+res[2])/this.renderer.imageWidth, (res[1]+res[3])/this.renderer.imageHeight];
			console.log("Box2Track suivante=",this.Box2Track[0],this.Box2Track[1],this.Box2Track[2],this.Box2Track[3])
            this.emitUpdate();
        });
    }

	public createRectangle() {
        this.updated = false;
        const shape = this.tmpShape as GraphicRectangle;
        const v: number[] = shape.data.geometry.vertices;
        const xmin = Math.min(v[0], v[2]);
        const xmax = Math.max(v[0], v[2]);
        const ymin = Math.min(v[1], v[3]);
        const ymax = Math.max(v[1], v[3]);
		this.Box2Track = [xmin,ymin,xmax,ymax];
		console.log("in=",xmin,ymin,xmax,ymax)
		// this.track(this.Box2Track[0],this.Box2Track[1],this.Box2Track[2],this.Box2Track[3]);



        shape.data.id = Math.random().toString(36).substring(7);
        shape.data.geometry.vertices = [xmin, ymin, xmax, ymax];
        this.renderer.stage.removeChild(shape);
        shape.destroy();
        this.tmpShape = null;
        this.shapes.add(shape.data);
        this.emitCreate();
    }
}

//... à remonter dasn Canvas2D
export class ClickController extends ShapeCreateController {

    protected onRootDown(evt: PIXI.InteractionEvent) {
        const pointer = (evt.data.originalEvent as PointerEvent);
        if (pointer.buttons === 2 || pointer.buttons === 4) {
            return;
        }
        const mouse = this.renderer.getPosition(evt.data);
        this.dispatchEvent(new CustomEvent('point', {detail: this.renderer.normalize(mouse)}));
    }
}
