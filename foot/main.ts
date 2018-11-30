module BABYLON {
    export class Main {
        // Public members
        public scene: Scene;

        // Private members
        private _ground: GroundMesh = null;
        private _ball: Mesh = null;
        private _skybox: Mesh = null;
        private _obstacles: Mesh[] = [];
     
        private _length = 500.0;
        private _width = this._length / 2;
        private _ratio = this._length / 5;

        private _light: PointLight = null;

        private _camera: FreeCamera = null;

        constructor (scene: Scene) {
            this.scene = scene;
        }
        
        // Setup a basic shader
        public setupBasicShader (): void {
            // Why not :)
            var material = new ShaderMaterial("shaderMaterial", this.scene,
                {
                    vertex: "IT",
                    fragment: "IT"
                },
                {
                    // Options
                    attributes: ["position", "uv"],
                    uniforms: ["worldViewProjection", "time"],
                    samplers: ["makiTexture"]
                }
            );

            var time = 0;
            material.onBind = (mesh: AbstractMesh) => {
                time += 16;
                material.setFloat("time", time);
            };

            material.setTexture("makiTexture", new Texture("assets/ball.png", this.scene));

            this._ball.material = material;
        }

        //Setup the physics bodies of each meshes
        public setupPhysics (): void {
            // Setup physics in scene
            this.scene.enablePhysics(new Vector3(0, -9.81, 0), new CannonJSPlugin());
            // Set physics bodies
            this._ground.physicsImpostor = new PhysicsImpostor(this._ground, PhysicsImpostor.BoxImpostor, { mass: 0 });
            this._ball.physicsImpostor = new PhysicsImpostor(this._ball, PhysicsImpostor.SphereImpostor, { mass: 1 });
            this._obstacles.forEach((o) => o.physicsImpostor = new PhysicsImpostor(o, PhysicsImpostor.BoxImpostor, { mass: 0 }));
            // Tap the ball
            this._ball.actionManager = new ActionManager(this.scene);
            this._ball.actionManager.registerAction(
                new ExecuteCodeAction(ActionManager.OnLeftPickTrigger, (evt) => {
                    //console.log("Ball clicked!");
                    var pick = this.scene.pick(this.scene.pointerX, this.scene.pointerY);

                    var coef = 3;
                    var force = pick.pickedPoint.subtract(this._camera.position);

                    force = force.multiply(new Vector3(coef, coef, coef));

                    this._ball.applyImpulse(force, pick.pickedPoint);

                    setTimeout(() => {
                        /*this._ball.position.x = 0;
                        this._ball.position.y = 0.5;
                        this._ball.position.z = 0;*/
                        this._ball.position = new Vector3(0, 1.5, 0);
                        this._ball.getPhysicsImpostor().dispose();
                        this._ball.physicsImpostor = new PhysicsImpostor(this._ball, PhysicsImpostor.SphereImpostor, { mass: 1});
                    }, 5000);
                })
            );
        }

        // Setups collisions on objects and camera
        public setupCollisions (): void {
            //Setup camera collisions
            this.scene.gravity = new Vector3(0, -0.981, 0);
            this._camera.ellipsoid = new Vector3(2,3,2);

            this._camera.checkCollisions = true;
            this._camera.applyGravity = true;

            this._ground.checkCollisions = true;
            this._ball.checkCollisions = true;

            this._obstacles.forEach((o) => o.checkCollisions = true);
            
        }

        // Setups the meshes used to play football
        public createMeshes (): void {
            // Create camera
            this._camera = new FreeCamera("camera", new Vector3(10, 6, 0), this.scene);
            this._camera.attachControl(this.scene.getEngine().getRenderingCanvas());

            // Map ZQSD keys to move camera
            this._camera.keysUp = [90]; // Z
            this._camera.keysDown = [83]; // S
            this._camera.keysLeft = [81] // Q
            this._camera.keysRight = [68]; // D

            this._camera.setTarget(new Vector3(0, 0, 0));

            // Create light
            this._light = new PointLight("light", new Vector3(0, 100, 0), this.scene);

            // Create scene meshes
            this._ground = <GroundMesh> Mesh.CreateGround("ground", this._length + this._length / 10, this._width + this._width / 10, 2, this.scene);

            // Create materials
            var groundMaterial = new StandardMaterial("ground", this.scene);
            this._ground.material = groundMaterial;
            var grassTexture = new Texture("assets/grass.jpg", this.scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
            grassTexture.uScale = grassTexture.vScale = this._ratio;
            groundMaterial.diffuseTexture = grassTexture;
            groundMaterial.diffuseColor = Color3.Yellow();
            groundMaterial.specularColor = Color3.Black(); // new Color3(0, 0, 0);

            





            // Skybox
            this._skybox = Mesh.CreateBox("skybox", 1000, this.scene, false, Mesh.BACKSIDE);

            var skyboxMaterial = new StandardMaterial("skyboxMaterial", this.scene);
            skyboxMaterial.reflectionTexture = new CubeTexture("assets/TropicalSunnyDay", this.scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
            skyboxMaterial.disableLighting = true;
            this._skybox.infiniteDistance = true;

            this._skybox.material = skyboxMaterial;

            // Create obstacles
            var leftCube = Mesh.CreateBox("leftCube", 10, this.scene);
            leftCube.position.x -= this._ground._width / 2;
            leftCube.position.y = 5;
            //leftCube.scaling.z = 30;
            leftCube.scaling.z = this._ground._height / 10;
            leftCube.scaling.x = 0.1;

            var rightCube = Mesh.CreateBox("rightCube", 10, this.scene);
            rightCube.position.x += this._ground._width / 2; // Same as left cube except +this._ground._height
            rightCube.position.y = 5;
            //rightCube.scaling.z = 30;
            rightCube.scaling.z = this._ground._height / 10;
            rightCube.scaling.x = 0.1;

            var backCube = Mesh.CreateBox("backCube", 10, this.scene);
            backCube.position.z -= this._ground._height / 2;
            backCube.position.y = 5;
            //backCube.scaling.x = 60;
            backCube.scaling.x = this._ground._width / 10;
            backCube.scaling.z = 0.1;

            var frontCube = Mesh.CreateBox("frontCube", 10, this.scene);
            frontCube.position.z += this._ground._height / 2;
            frontCube.position.y = 5;
            //frontCube.scaling.x = 60;
            frontCube.scaling.x = this._ground._width / 10;
            frontCube.scaling.z = 0.1;

            //Declaration of height offset for planes
            var offset = 0.005;
            var h = offset;
            //Goal outlines
            var frontOuterGoalLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 8 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            frontOuterGoalLine.rotation.y = Math.PI/4;
            frontOuterGoalLine.position.x -= this._length / 2.03;
            var backOuterGoalLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 8 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            backOuterGoalLine.rotation.y = Math.PI/4;
            backOuterGoalLine.position.x += this._length / 2.03;
            h += offset;
            var frontInnerGoalLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 8 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            frontInnerGoalLine.rotation.y = Math.PI/4;
            frontInnerGoalLine.position.x -= this._length / 2.03;
            frontInnerGoalLine.material = groundMaterial;
            var backInnerGoalLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 8 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            backInnerGoalLine.rotation.y = Math.PI/4;
            backInnerGoalLine.position.x += this._length / 2.03;
            backInnerGoalLine.material = groundMaterial;
            h += offset;
            //Outer side of sideline   
            var outerSideLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 2 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            outerSideLine.rotation.y = Math.PI/4;
            outerSideLine.position.x += this._width / 2;
            var outerSideLine2 = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 2 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            outerSideLine2.rotation.y = Math.PI/4;
            outerSideLine2.position.x -= this._width / 2;
            h += offset;
            //Inner side of sideline
            var innerSideLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 2 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            innerSideLine.rotation.y = Math.PI/4;
            innerSideLine.position.x += this._width / 2;
            var innerSideLine2 = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 2 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            innerSideLine2.rotation.y = Math.PI/4;
            innerSideLine2.position.x -= this._width / 2;
            innerSideLine.material = groundMaterial;
            innerSideLine2.material = groundMaterial;
            h += offset;
            //Goal circles
            var outerFrontGoalCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 10, 3, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            outerFrontGoalCircle.position.x -= this._length / 2 - this._length / 2 * 0.14;
            var outerBackGoalCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 10, 3, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            outerBackGoalCircle.position.x += this._length / 2 - this._length / 2 * 0.14;
            h += offset;
            var innerFrontGoalCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 10 - 1, 3, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            innerFrontGoalCircle.position.x -= this._length / 2 - this._length / 2 * 0.14;
            //innerFrontGoalCircle.material = groundMaterial;
            var innerBackGoalCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 10 - 1, 3, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            innerBackGoalCircle.position.x += this._length / 2 - this._length / 2 * 0.14;
            //innerBackGoalCircle.material = groundMaterial;
            h += offset;
            //Keeper limits
                //front-outer
            var frontOuterGoalLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            frontOuterGoalLine.rotation.y = Math.PI/4;
            frontOuterGoalLine.position.x -= this._length / 2.2222;
            var frontOuterGoalLineLeft = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            frontOuterGoalLineLeft.rotation.y = Math.PI/4;
            frontOuterGoalLineLeft.position.x -= this._length / 2.2222;
            frontOuterGoalLineLeft.position.z -= this._width / 8;
            var frontOuterGoalLineRight = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            frontOuterGoalLineRight.rotation.y = Math.PI/4;
            frontOuterGoalLineRight.position.x -= this._length / 2.2222;
            frontOuterGoalLineRight.position.z += this._width / 8;
                //back-outer
            var backOuterGoalLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            backOuterGoalLine.rotation.y = Math.PI/4;
            backOuterGoalLine.position.x += this._length / 2.2222;
            var backOuterGoalLineLeft = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            backOuterGoalLineLeft.rotation.y = Math.PI/4;
            backOuterGoalLineLeft.position.x += this._length / 2.2222;
            backOuterGoalLineLeft.position.z += this._width / 8;
            var backOuterGoalLineRight = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2), 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            backOuterGoalLineRight.rotation.y = Math.PI/4;
            backOuterGoalLineRight.position.x += this._length / 2.2222;
            backOuterGoalLineRight.position.z -= this._width / 8;
            h += offset;
                //front-inner
            var frontInnerGoalLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            frontInnerGoalLine.rotation.y = Math.PI/4;
            frontInnerGoalLine.position.x -= this._length / 2.2222;
            frontInnerGoalLine.material = groundMaterial;
            h += offset;
            var frontInnerGoalLineLeft = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            frontInnerGoalLineLeft.rotation.y = Math.PI/4;
            frontInnerGoalLineLeft.position.x -= this._length / 2.2222;
            frontInnerGoalLineLeft.position.z -= this._width / 8;
            frontInnerGoalLineLeft.material = groundMaterial;
            h += offset;
            var frontInnerGoalLineRight = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            frontInnerGoalLineRight.rotation.y = Math.PI/4;
            frontInnerGoalLineRight.position.x -= this._length / 2.2222;
            frontInnerGoalLineRight.position.z += this._width / 8;
            frontInnerGoalLineRight.material = groundMaterial;
                //back-inner
            var backInnerGoalLine = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            backInnerGoalLine.rotation.y = Math.PI/4;
            backInnerGoalLine.position.x += this._length / 2.2222;
            backInnerGoalLine.material = groundMaterial;
            h += offset;
            var backInnerGoalLineLeft = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            backInnerGoalLineLeft.rotation.y = Math.PI/4;
            backInnerGoalLineLeft.position.x += this._length / 2.2222;
            backInnerGoalLineLeft.position.z += this._width / 8;
            backInnerGoalLineLeft.material = groundMaterial;
            h += offset;
            var backInnerGoalLineRight = BABYLON.Mesh.CreateCylinder("cylinder", h, this._width / 5 * Math.sqrt(2) - 1, 3, 4, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            backInnerGoalLineRight.rotation.y = Math.PI/4;
            backInnerGoalLineRight.position.x += this._length / 2.2222;
            backInnerGoalLineRight.position.z -= this._width / 8;
            backInnerGoalLineRight.material = groundMaterial;
            h += offset;
            //Goal dots
            var outerFrontGoalCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length /this._length, 3, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            outerFrontGoalCircle.position.x -= this._length / 2 - this._length / 2 * 0.14;
            var outerBackGoalCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / this._length, 3, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            outerBackGoalCircle.position.x += this._length / 2 - this._length / 2 * 0.14;

            //Middle circle
            var outerMiddleCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 10, 3, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            h += offset;
            var innerMiddleCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, this._length / 10 - 1, 3, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);
            h += offset;
            //grassTexture.uScale = grassTexture.vScale = 10.0;
            //largeMiddleCircle.material = groundMaterial;
            var middleCircle = BABYLON.Mesh.CreateCylinder("cylinder", h, 1, 1, 100, 1, this.scene, false, BABYLON.Mesh.DEFAULTSIDE);

            //circle material
            var circleMaterial = new StandardMaterial("ground", this.scene);
            innerBackGoalCircle.material = circleMaterial;
            innerFrontGoalCircle.material = circleMaterial;
            innerMiddleCircle.material = circleMaterial;
            var circleTexture = new Texture("assets/grass.jpg", this.scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
            circleTexture.uScale = circleTexture.vScale = this._ratio / 10;
            circleMaterial.diffuseTexture = circleTexture;
            circleMaterial.diffuseColor = Color3.Yellow();
            circleMaterial.specularColor = Color3.Black(); // new Color3(0, 0, 0);

            //goal material
            var goalMaterial = new StandardMaterial("ground", this.scene);
            var goalTexture = new Texture("assets/grass.jpg", this.scene, false, false, Texture.TRILINEAR_SAMPLINGMODE);
            goalTexture.uScale = goalTexture.vScale = this._ratio / 10;
            goalMaterial.diffuseTexture = goalTexture;
            goalMaterial.diffuseColor = Color3.Yellow();
            goalMaterial.specularColor = Color3.Black(); // new Color3(0, 0, 0);

            this._obstacles = [leftCube, rightCube, backCube, frontCube];

            // Create ball
            this._ball = Mesh.CreateSphere("ball", 50, 1, this.scene);
            this._ball.position.y = 1.5;
        }
    }
}
