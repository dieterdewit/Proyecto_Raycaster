/* --------------------------
Proyecto 3 - Graficas
Dieter de Wit
----------------------------- */

function Raycaster(canvas) {
  this.width = canvas.width;
	this.height = canvas.height;  
  this.frameRender = 18;
  this.canvas = canvas;  
  this.canvasContext = this.canvas.getContext('2d');
  this.offscreenCanvas = document.createElement('canvas');
  this.offscreenCanvas.width = canvas.width;
  this.offscreenCanvas.height = canvas.height;
  this.offscreenCanvasContext = this.offscreenCanvas.getContext('2d');
	this.offscreenCanvasPixels =  this.offscreenCanvasContext.getImageData(0,0,canvas.width, canvas.height); 
	this.title = 64;
	this.Wall_Height = 64;
	this.ViewPortWidth = 720;
	this.ViewPortHeight = 600;

	this.ANGLE60 = this.ViewPortWidth;
	this.ANGLE30 = Math.floor(this.ANGLE60/2);
	this.ANGLE15 = Math.floor(this.ANGLE30/2);
	this.ANGLE90 = Math.floor(this.ANGLE30*3);
	this.ANGLE180 = Math.floor(this.ANGLE90*2);
	this.ANGLE270 = Math.floor(this.ANGLE90*3);
	this.ANGLE360 = Math.floor(this.ANGLE60*6);
	this.ANGLE0 = 0;
	this.ANGLE5 = Math.floor(this.ANGLE30/6);
	this.ANGLE10 = Math.floor(this.ANGLE5*2);
	this.ANGLE45 = Math.floor(this.ANGLE15*3);
	
	this.fSinTable=[];
	this.fISinTable=[];
	this.fCosTable=[];
	this.fICosTable=[];
	this.fTanTable=[];
	this.fITanTable=[];
	this.scopeDistort=[];
	this.fXStepTable=[];
	this.fYStepTable=[];
	this.fPlayerX = 100;
	this.fPlayerY = 160;
	this.fPlayerArc = this.ANGLE5+this.ANGLE5;
	this.PlayerToProyection = 250;
	this.fPlayerHeight = 30;
	this.fPlayerSpeed = 15;
	this.ProjectionPlaneView = this.ViewPortHeight/2;
	this.fPlayerMapX;
	this.fPlayerMapY;
	this.fMinimapWidth;
	this.fKeyUp=false;
	this.fKeyDown=false;
	this.fKeyLeft=false; 
	this.fKeyRight=false;

	this.fMap=[];
	this.MapWidth;
	this.MapHeight; 
	this.animationFrameID;
	this.wallTextureCanvas;
	this.wallTexturePixel;
	this.fBackgroundImageArc=0;
} 

Raycaster.prototype = 
{
	loadWallTexture : function()
	{
		this.fWallTexture= new Image();
		this.fWallTexture.onload = this.onWallTextureLoaded.bind(this);
		this.fWallTexture.src = "images/rock.jpg";		
	},
	
	loadFloorTexture : function()
	{
		this.fFloorTexture= new Image();
		this.fFloorTexture.onload = this.onFloorTextureLoaded.bind(this);
		this.fFloorTexture.src = "images/lava.png";		
	},	

	loadBackgroundTexture : function()
	{
		this.fBackgroundTexture= new Image();
		this.fBackgroundTexture.onload = this.onBackgroundTextureLoaded.bind(this);
		this.fBackgroundTexture.src = "images/sky2.jpg";		
	},
	
	onWallTextureLoaded : function(image)
	{
		this.wallTextureBuffer = document.createElement('canvas');		
		this.wallTextureBuffer.width = this.fWallTexture.width;
		this.wallTextureBuffer.height = this.fWallTexture.height;
		this.wallTextureBuffer.getContext('2d').drawImage(this.fWallTexture, 0, 0);
		var imageData = this.wallTextureBuffer.getContext('2d').getImageData(0, 0, this.wallTextureBuffer.width, this.wallTextureBuffer.height);
		this.wallTexturePixel = imageData.data;
	},

	onFloorTextureLoaded : function(image)
	{
		this.floorTextureBuffer = document.createElement('canvas');		
		this.floorTextureBuffer.width = this.fFloorTexture.width;
		this.floorTextureBuffer.height = this.fFloorTexture.height;
		this.floorTextureBuffer.getContext('2d').drawImage(this.fFloorTexture, 0, 0);
		var imageData = this.floorTextureBuffer.getContext('2d').getImageData(0, 0, this.floorTextureBuffer.width, this.floorTextureBuffer.height);
		this.fFloorTexturePixels = imageData.data;
	},

	onBackgroundTextureLoaded : function(image)
	{
		this.fBackgroundTextureBuffer = document.createElement('canvas');		
		this.fBackgroundTextureBuffer.width = this.fBackgroundTexture.width;
		this.fBackgroundTextureBuffer.height = this.fBackgroundTexture.height;
		this.fBackgroundTextureBuffer.getContext('2d').drawImage(this.fBackgroundTexture, 0, 0);
		var imageData = this.fBackgroundTextureBuffer.getContext('2d').getImageData(0, 0, this.fBackgroundTextureBuffer.width, this.fBackgroundTextureBuffer.height);
		this.fBackgroundTexturePixels = imageData.data;
	},
	
	arcToRad: function(arcAngle)
	{
		return ((arcAngle*Math.PI)/this.ANGLE180);    
	},
	
	drawLine: function(startX, startY, endX, endY, red, green, blue, alpha)
	{
		var bytesPerPixel=4;
		var xIncrement, yIncrement;  
		var dy = endY - startY;             
		
		if (dy<0)             
		{
			dy = -dy;
			yIncrement = -this.offscreenCanvasPixels.width*bytesPerPixel;
		}
		else
			yIncrement = this.offscreenCanvasPixels.width*bytesPerPixel;
	                  
		var dx = endX - startX;         
		
		if (dx<0)
		{
			dx = -dx;
			xIncrement = -bytesPerPixel;
		}
		else
			xIncrement = bytesPerPixel;
	
		var error=0;
		var targetIndex = (bytesPerPixel*this.offscreenCanvasPixels.width)*startY+(bytesPerPixel*startX);
		
		if (dx>dy)
		{                     
			var length = dx;
			for (var i=0;i<length;i++)
			{
				if (targetIndex<0)
					break;
					
				this.offscreenCanvasPixels.data[targetIndex]=red;
				this.offscreenCanvasPixels.data[targetIndex+1]=green;
				this.offscreenCanvasPixels.data[targetIndex+2]=blue;
				this.offscreenCanvasPixels.data[targetIndex+3]=alpha;
				
				targetIndex+=xIncrement;           
				error+=dy;
									  	                      
				if (error>=dx)
				{
					error-=dx;
					targetIndex+=yIncrement;
				}
			}
		}

		else 
		{                       
			var length=dy;
			for (var i=0;i<length;i++)
			{       
				if (targetIndex<0)
					break;
					
				this.offscreenCanvasPixels.data[targetIndex]=red;
				this.offscreenCanvasPixels.data[targetIndex+1]=green;
				this.offscreenCanvasPixels.data[targetIndex+2]=blue;
				this.offscreenCanvasPixels.data[targetIndex+3]=alpha;
				targetIndex+=yIncrement;
				error+=dx;
				
				if (error>=dy)
				{
					error-=dy;
					targetIndex+=xIncrement;
				}
			}
		}
	},
	
	drawSlices: function(x, y, width, height, xOffset, brighnessLevel)
	{
		if (this.wallTextureBuffer==undefined)
			return;
		
		var dy=height;
		x=Math.floor(x);
		y=Math.floor(y);
		xOffset=Math.floor(xOffset);
		var bytesPerPixel=4;
		var sourceIndex=(bytesPerPixel*xOffset);
		var lastSourceIndex=sourceIndex+(this.wallTextureBuffer.width*this.wallTextureBuffer.height*bytesPerPixel);
		var targetIndex=(this.offscreenCanvasPixels.width*bytesPerPixel)*y+(bytesPerPixel*x);
		var heightToDraw = height;

		if (y+heightToDraw>this.offscreenCanvasPixels.height)
			heightToDraw=this.offscreenCanvasPixels.height-y;

		var yError=0;   
		
		if (heightToDraw<0)
			return;

		while (true)
		{                     
			yError += height;
												  
			var red=Math.floor(this.wallTexturePixel[sourceIndex]*brighnessLevel);
			var green=Math.floor(this.wallTexturePixel[sourceIndex+1]*brighnessLevel);
			var blue=Math.floor(this.wallTexturePixel[sourceIndex+2]*brighnessLevel);
			var alpha=Math.floor(this.wallTexturePixel[sourceIndex+3]);

			while (yError>=this.wallTextureBuffer.width)
			{                  
				yError-=this.wallTextureBuffer.width;
				this.offscreenCanvasPixels.data[targetIndex]=red;
				this.offscreenCanvasPixels.data[targetIndex+1]=green;
				this.offscreenCanvasPixels.data[targetIndex+2]=blue;
				this.offscreenCanvasPixels.data[targetIndex+3]=alpha;
				targetIndex+=(bytesPerPixel*this.offscreenCanvasPixels.width);
				heightToDraw--;
				if (heightToDraw<1)
					return;
			} 
			sourceIndex+=(bytesPerPixel*this.wallTextureBuffer.width);
			if (sourceIndex>lastSourceIndex)
				sourceIndex=lastSourceIndex;			
		}
	},	
	
	clearOffCanvas : function()
	{
		this.offscreenCanvasContext.clearRect(0, 0, this.width, this.height);

		if (this.fBackgroundTextureBuffer!=undefined)
		{
			this.offscreenCanvasContext.drawImage(this.fBackgroundTexture,
				0,0, 
				this.ViewPortWidth-this.fBackgroundImageArc, this.ViewPortHeight,
				this.fBackgroundImageArc, 0, 
				this.ViewPortWidth-this.fBackgroundImageArc, this.ViewPortHeight);		
			this.offscreenCanvasPixels=this.offscreenCanvasContext.getImageData(0,0,canvas.width, canvas.height);	
		}

	},
	
	updateOffCanvas : function()
	{
		this.canvasContext.putImageData(this.offscreenCanvasPixels,0,0);
	},
	
	fillRectangle: function(x, y, width, height, red, green, blue, alpha)
	{
		var bytesPerPixel=4;
		var targetIndex=(bytesPerPixel*this.offscreenCanvasPixels.width)*y+(bytesPerPixel*x);
		for (var h=0; h<height; h++)
		{
			for (var w=0; w<width; w++)
			{
				this.offscreenCanvasPixels.data[targetIndex]=red;
				this.offscreenCanvasPixels.data[targetIndex+1]=green;
				this.offscreenCanvasPixels.data[targetIndex+2]=blue;
				this.offscreenCanvasPixels.data[targetIndex+3]=alpha;
				targetIndex+=bytesPerPixel;
			}
			targetIndex+=(bytesPerPixel*(this.offscreenCanvasPixels.width-width));
		}	
	},
	
	init: function()
	{
		this.loadWallTexture();
		this.loadFloorTexture();
		this.loadBackgroundTexture();
		var i;
		var radian;
		this.fSinTable = new Array(this.ANGLE360+1);
		this.fISinTable = new Array(this.ANGLE360+1);
		this.fCosTable = new Array(this.ANGLE360+1);
		this.fICosTable = new Array(this.ANGLE360+1);
		this.fTanTable = new Array(this.ANGLE360+1);
		this.fITanTable = new Array(this.ANGLE360+1);
		this.scopeDistort = new Array(this.ANGLE360+1);
		this.fXStepTable = new Array(this.ANGLE360+1);
		this.fYStepTable = new Array(this.ANGLE360+1);

		for (i=0; i<=this.ANGLE360;i++)
		{
			radian = this.arcToRad(i) + (0.0001);
			this.fSinTable[i]=Math.sin(radian);
			this.fISinTable[i]=(1.0/(this.fSinTable[i]));
			this.fCosTable[i]=Math.cos(radian);
			this.fICosTable[i]=(1.0/(this.fCosTable[i]));
			this.fTanTable[i]=Math.tan(radian);
			this.fITanTable[i]=(1.0/this.fTanTable[i]);

			if (i>=this.ANGLE90 && i<this.ANGLE270)
			{
				this.fXStepTable[i] = (this.title/this.fTanTable[i]);
				if (this.fXStepTable[i]>0)
					this.fXStepTable[i]=-this.fXStepTable[i];
			}
			else
			{
				this.fXStepTable[i] = (this.title/this.fTanTable[i]);
				if (this.fXStepTable[i]<0)
					this.fXStepTable[i]=-this.fXStepTable[i];
			}
			if (i>=this.ANGLE0 && i<this.ANGLE180)
			{
				this.fYStepTable[i] = (this.title*this.fTanTable[i]);
				if (this.fYStepTable[i]<0)
					this.fYStepTable[i]=-this.fYStepTable[i];
			}
			else
			{
				this.fYStepTable[i] = (this.title*this.fTanTable[i]);
				if (this.fYStepTable[i]>0)
					this.fYStepTable[i]=-this.fYStepTable[i];
			}
		}

		for (i=-this.ANGLE30; i<=this.ANGLE30; i++)
		{
			radian = this.arcToRad(i);
			this.scopeDistort[i+this.ANGLE30] = (1.0/Math.cos(radian));
		}
				var map=
				'WWWWWWWWWWWW'+
				'WOOOOOOOOOOW'+
				'WOOOOWWWWOOW'+
				'WOOOOOOOWOOW'+
				'WOOWOWOOWWOW'+
				'WOOWOWWOWOOW'+
				'WOOWOOWOWOWW'+
				'WOOOWOWOWOOW'+
				'WOWOWOWOWWOW'+
				'WOWWWWWOWOOW'+
				'WOOOOOOOOOOW'+
				'WWWWWWWWWWWW';	

      this.fMap=map.replace(/\s+/g, '');
			this.MapWidth=12;
			this.MapHeight=12; 		
	},
	
	drawOverheadMap : function()
	{
		this.fMinimapWidth=5;
		for (var r=0; r<this.MapHeight; r++)
		{
			for (var c=0; c<this.MapWidth; c++)
			{
				var cssColor="white";
				if (this.fMap.charAt(r*this.MapWidth+c)!="O")
				{
					this.fillRectangle(this.ViewPortWidth+(c*this.fMinimapWidth),
						(r*this.fMinimapWidth), this.fMinimapWidth, this.fMinimapWidth, 0, 0,0, 255);
				}
				else
				{
					this.fillRectangle(this.ViewPortWidth+(c*this.fMinimapWidth),
						(r*this.fMinimapWidth), this.fMinimapWidth, this.fMinimapWidth, 255, 255,255, 255);
				}
			}
		}
		this.fPlayerMapX=this.ViewPortWidth+((this.fPlayerX/this.title) * this.fMinimapWidth);
		this.fPlayerMapY=((this.fPlayerY/this.title) * this.fMinimapWidth);
		
	},
	
	rgbToHexColor : function(red, green, blue) 
	{
		var result="#"+
			red.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+""+
			green.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})+""+
			blue.toString(16).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
		return result;
	},

	drawBackground : function()
	{
		this.fBackgroundImageArc

		return;
	},

	drawRayOnOverheadMap : function(x, y)
	{
		this.drawLine(
			Math.floor(this.fPlayerMapX), 
			Math.floor(this.fPlayerMapY), 
			Math.floor(this.ViewPortWidth+((x*this.fMinimapWidth)/this.title)),
			Math.floor(((y*this.fMinimapWidth)/this.title)), 
			0,255,0,255);
	},
	
	raycast : function()
	{
		var verticalGrid;       
		var horizontalGrid;    
		var distToNextVerticalGrid; 
		var distToNextHorizontalGrid; 
		var xIntersection; 
		var yIntersection;
		var distToNextXInt;
		var distToNextYInt;
		var xGridIndex;  
		var yGridIndex;
		var distToVerticalHit;
		var distToHorizontalHit;     
		var castArc, castColumn;
		
		castArc = this.fPlayerArc;
		castArc-=this.ANGLE30;

		if (castArc < 0)
		{
			castArc=this.ANGLE360 + castArc;
		}

		for (castColumn=0; castColumn<this.ViewPortWidth; castColumn+=1)
		{
			if (castArc > this.ANGLE0 && castArc < this.ANGLE180)
			{
				horizontalGrid = Math.floor(this.fPlayerY/this.title)*this.title  + this.title;
				distToNextHorizontalGrid = this.title;
				var xtemp = this.fITanTable[castArc]*(horizontalGrid-this.fPlayerY);
				xIntersection = xtemp + this.fPlayerX;		
			}
			else
			{
				horizontalGrid = Math.floor(this.fPlayerY/this.title)*this.title;
				distToNextHorizontalGrid = -this.title;
				var xtemp = this.fITanTable[castArc]*(horizontalGrid - this.fPlayerY);
				xIntersection = xtemp + this.fPlayerX;
				horizontalGrid--;
			}
			if (castArc==this.ANGLE0 || castArc==this.ANGLE180)
			{
				distToHorizontalHit=Number.MAX_VALUE;
			}
			else
			{
				distToNextXInt = this.fXStepTable[castArc];
				while (true)
				{
					xGridIndex = Math.floor(xIntersection/this.title);
					yGridIndex = Math.floor(horizontalGrid/this.title);
					var mapIndex=Math.floor(yGridIndex*this.MapWidth+xGridIndex);

					if ((xGridIndex>=this.MapWidth) ||
						(yGridIndex>=this.MapHeight) ||
						xGridIndex<0 || yGridIndex<0)
					{
						distToHorizontalHit = Number.MAX_VALUE;
						break;
					}
					else if (this.fMap.charAt(mapIndex)!='O')
					{
						distToHorizontalHit  = (xIntersection-this.fPlayerX)*this.fICosTable[castArc];
						break;
					}
					else
					{
						xIntersection += distToNextXInt;
						horizontalGrid += distToNextHorizontalGrid;
					}
				}
			}

			if (castArc < this.ANGLE90 || castArc > this.ANGLE270)
			{
				verticalGrid = this.title + Math.floor(this.fPlayerX/this.title)*this.title;
				distToNextVerticalGrid = this.title;
				var ytemp = this.fTanTable[castArc]*(verticalGrid - this.fPlayerX);
				yIntersection = ytemp + this.fPlayerY;
			}
			else
			{
				verticalGrid = Math.floor(this.fPlayerX/this.title)*this.title;
				distToNextVerticalGrid = -this.title;
				var ytemp = this.fTanTable[castArc]*(verticalGrid - this.fPlayerX);
				yIntersection = ytemp + this.fPlayerY;

				verticalGrid--;
			}

			if (castArc==this.ANGLE90||castArc==this.ANGLE270)
			{
				distToVerticalHit = Number.MAX_VALUE;
			}
			else
			{
				distToNextYInt = this.fYStepTable[castArc];
				while (true)
				{
					xGridIndex = Math.floor(verticalGrid/this.title);
					yGridIndex = Math.floor(yIntersection/this.title);
					var mapIndex=Math.floor(yGridIndex*this.MapWidth+xGridIndex);
					
					if ((xGridIndex>=this.MapWidth) || 
						(yGridIndex>=this.MapHeight) ||
						xGridIndex<0 || yGridIndex<0)
					{
						distToVerticalHit = Number.MAX_VALUE;
						break;
					}
					else if (this.fMap.charAt(mapIndex)!='O')
					{
						distToVerticalHit =(yIntersection-this.fPlayerY)*this.fISinTable[castArc];
						break;
					}
					else
					{
						yIntersection += distToNextYInt;
						verticalGrid += distToNextVerticalGrid;
					}
				}
			}

			var scaleFactor;
			var dist;
			var xOffset;
			var topOfWall;   
			var bottomOfWall;   
			var isVerticalHit=false;
			if (distToHorizontalHit < distToVerticalHit)
			{
				this.drawRayOnOverheadMap(xIntersection, horizontalGrid);
				dist=distToHorizontalHit;
				xOffset=xIntersection%this.title;
			}
			else
			{
				isVerticalHit=true;
				this.drawRayOnOverheadMap(verticalGrid, yIntersection);
				dist=distToVerticalHit;
				xOffset=yIntersection%this.title;
				
			}
			dist /= this.scopeDistort[castColumn];
			var projectedWallHeight=(this.Wall_Height*this.PlayerToProyection/dist);
			bottomOfWall = this.ProjectionPlaneView+(projectedWallHeight*0.5);
			topOfWall = this.ProjectionPlaneView-(projectedWallHeight*0.5);
			dist=Math.floor(dist);

			if (isVerticalHit)
				this.drawSlices(castColumn, topOfWall, 1, (bottomOfWall-topOfWall)+1, xOffset, 160/(dist));
			else
				this.drawSlices(castColumn, topOfWall, 1, (bottomOfWall-topOfWall)+1, xOffset, 100/(dist));
				
			var bytesPerPixel=4;
			var projectionPlaneCenterY=this.ViewPortHeight/2;
			var lastBottomOfWall = Math.floor(bottomOfWall);
			
			if (this.floorTextureBuffer!=undefined)
			{
				var targetIndex=lastBottomOfWall*(this.offscreenCanvasPixels.width*bytesPerPixel)+(bytesPerPixel*castColumn);
				for (var row=lastBottomOfWall;row<this.ViewPortHeight;row++) 
				{                          
					var ratio=(this.fPlayerHeight)/(row-projectionPlaneCenterY);
					var diagonalDistance=Math.floor((this.PlayerToProyection*ratio)*
						(this.scopeDistort[castColumn]));

					var yEnd = Math.floor(diagonalDistance * this.fSinTable[castArc]);
					var xEnd = Math.floor(diagonalDistance * this.fCosTable[castArc]);
					xEnd+=this.fPlayerX;
					yEnd+=this.fPlayerY;
					var cellX = Math.floor(xEnd / this.title);
					var cellY = Math.floor(yEnd / this.title);
	
					if ((cellX<this.MapWidth) &&   
						(cellY<this.MapHeight) &&
						cellX>=0 && cellY>=0)
					{            
						var tileRow = Math.floor(yEnd % this.title);
						var tileColumn = Math.floor(xEnd % this.title);
						var sourceIndex=(tileRow*this.floorTextureBuffer.width*bytesPerPixel)+(bytesPerPixel*tileColumn);
						var brighnessLevel=(200/diagonalDistance);
						var red=Math.floor(this.fFloorTexturePixels[sourceIndex]*brighnessLevel);
						var green=Math.floor(this.fFloorTexturePixels[sourceIndex+1]*brighnessLevel);
						var blue=Math.floor(this.fFloorTexturePixels[sourceIndex+2]*brighnessLevel);
						var alpha=Math.floor(this.fFloorTexturePixels[sourceIndex+3]);						
						this.offscreenCanvasPixels.data[targetIndex]=red;
						this.offscreenCanvasPixels.data[targetIndex+1]=green;
						this.offscreenCanvasPixels.data[targetIndex+2]=blue;
						this.offscreenCanvasPixels.data[targetIndex+3]=alpha;
						targetIndex+=(bytesPerPixel*this.offscreenCanvasPixels.width);											
					}                                                              
				}	
			}
			castArc+=1;
			if (castArc>=this.ANGLE360)
				castArc-=this.ANGLE360;
		}

	},
  
	update : function() 
	{
		this.clearOffCanvas();
		this.drawOverheadMap();
		this.drawBackground();
		this.raycast();
		this.updateOffCanvas();
		var playerArcDelta=0;

		if (this.fKeyLeft)
		{
			this.fPlayerArc-=this.ANGLE10;
			playerArcDelta=-this.ANGLE5;
			if (this.fPlayerArc<this.ANGLE0)
				this.fPlayerArc+=this.ANGLE360;
		}
		else if (this.fKeyRight)
		{
			this.fPlayerArc+=this.ANGLE10;
			playerArcDelta=-this.ANGLE5;
			if (this.fPlayerArc>=this.ANGLE360)
				this.fPlayerArc-=this.ANGLE360;
		}

		this.fBackgroundImageArc-=playerArcDelta;
		if (this.fBackgroundTextureBuffer!=undefined)
		{
			if (this.fBackgroundImageArc<-this.ViewPortWidth*2)
				this.fBackgroundImageArc=this.ViewPortWidth*2+(this.fBackgroundImageArc);
			else if (this.fBackgroundImageArc>0)
				this.fBackgroundImageArc=-(this.fBackgroundTexture.width-this.ViewPortWidth- (this.fBackgroundImageArc));			
		}

		var playerXDir=this.fCosTable[this.fPlayerArc];
		var playerYDir=this.fSinTable[this.fPlayerArc];
		var dx=0;
		var dy=0;

		if (this.fKeyUp)
		{
			dx=Math.round(playerXDir*this.fPlayerSpeed);
			dy=Math.round(playerYDir*this.fPlayerSpeed);
		}
		else if (this.fKeyDown)
		{
			dx=-Math.round(playerXDir*this.fPlayerSpeed);
			dy=-Math.round(playerYDir*this.fPlayerSpeed);
		}
		this.fPlayerX+=dx;
		this.fPlayerY+=dy;
		
		var playerXCell = Math.floor(this.fPlayerX/this.title);
		var playerYCell = Math.floor(this.fPlayerY/this.title);
		var playerXCellOffset = this.fPlayerX % this.title;
		var playerYCellOffset = this.fPlayerY % this.title;
		var minDistanceToWall=30;
		
		if (dx>0)
		{
			if ((this.fMap.charAt((playerYCell*this.MapWidth)+playerXCell+1)!='O')&&
				(playerXCellOffset > (this.title-minDistanceToWall)))
			{
				this.fPlayerX-= (playerXCellOffset-(this.title-minDistanceToWall));
			}               
		}
		else
		{
			if ((this.fMap.charAt((playerYCell*this.MapWidth)+playerXCell-1)!='O')&&
				(playerXCellOffset < (minDistanceToWall)))
			{
				this.fPlayerX+= (minDistanceToWall-playerXCellOffset);
			} 
		} 

		if (dy<0)
		{
			if ((this.fMap.charAt(((playerYCell-1)*this.MapWidth)+playerXCell)!='O')&&
				(playerYCellOffset < (minDistanceToWall)))
			{
				this.fPlayerY+= (minDistanceToWall-playerYCellOffset);
			}
		}
		else
		{                               
			if ((this.fMap.charAt(((playerYCell+1)*this.MapWidth)+playerXCell)!='O')&&
				(playerYCellOffset > (this.title-minDistanceToWall)))
			{
				this.fPlayerY-= (playerYCellOffset-(this.title-minDistanceToWall ));
			}
		}    
		var object=this;

		setTimeout(function() 
		{
			object.animationFrameID = requestAnimationFrame(object.update.bind(object));
		}, 1000 / this.frameRender);		
	},

	handleKeyDown : function(e) 
	{
		if (!e)
			e = window.event;

		if (e.keyCode == '38'  || String.fromCharCode(e.keyCode)=='W') 
		{
			this.fKeyUp=true;
		}
		else if (e.keyCode == '40' || String.fromCharCode(e.keyCode)=='S') 
		{
			this.fKeyDown=true;
		}
		else if (e.keyCode == '37'  || String.fromCharCode(e.keyCode)=='A') 
		{
		   this.fKeyLeft=true;
		}
		else if (e.keyCode == '39'  || String.fromCharCode(e.keyCode)=='D') 
		{
		   this.fKeyRight=true;
		}
	},
  
	handleKeyUp : function(e) 
	{
		if (!e)
			e = window.event;

		if (e.keyCode == '38'  || String.fromCharCode(e.keyCode)=='W') 
		{
			this.fKeyUp=false;
		}
		if (e.keyCode == '40' || String.fromCharCode(e.keyCode)=='S') 
		{
			this.fKeyDown=false;
		}
		if (e.keyCode == '37'  || String.fromCharCode(e.keyCode)=='A') 
		{
		   this.fKeyLeft=false;
		}
		if (e.keyCode == '39'  || String.fromCharCode(e.keyCode)=='D') 
		{
		   this.fKeyRight=false;
		}
	},
	
	start : function()
	{
		this.init();
		window.addEventListener("keydown", this.handleKeyDown.bind(this), false);
		window.addEventListener("keyup", this.handleKeyUp.bind(this), false);
		this.animationFrameID = requestAnimationFrame(this.update.bind(this));
	}
}