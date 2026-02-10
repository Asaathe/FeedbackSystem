import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { X, Check, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageCropperProps {
  imageFile: File;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

interface CropBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
type HandleType = ResizeHandle | null;

export function ImageCropper({
  imageFile,
  onCropComplete,
  onCancel,
  aspectRatio = 4, // Default 4:1 aspect ratio for form headers
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const transformedImageRef = useRef<HTMLImageElement | null>(null);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageData, setImageData] = useState<{ width: number; height: number; src: string } | null>(null);
  const [cropBox, setCropBox] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<HandleType>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const src = e.target?.result as string;
      img.src = src;
      img.onload = () => {
        setImageData({
          width: img.width,
          height: img.height,
          src,
        });
        setImageLoaded(true);
        
        // Initialize crop box to center 80% of image
        const initialWidth = img.width * 0.8;
        const initialHeight = initialWidth / aspectRatio;
        
        setCropBox({
          x: (img.width - initialWidth) / 2,
          y: (img.height - initialHeight) / 2,
          width: initialWidth,
          height: initialHeight,
        });
      };
    };
    
    reader.readAsDataURL(imageFile);
  }, [imageFile, aspectRatio]);

  // Create transformed image (cached)
  useEffect(() => {
    if (!imageLoaded || !imageData) return;
    
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = imageData.width;
    offscreenCanvas.height = imageData.height;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (!offscreenCtx) return;
    
    const img = new Image();
    img.src = imageData.src;
    img.onload = () => {
      offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
      offscreenCtx.save();
      offscreenCtx.translate(offscreenCanvas.width / 2, offscreenCanvas.height / 2);
      offscreenCtx.rotate((rotation * Math.PI) / 180);
      offscreenCtx.scale(scale, scale);
      offscreenCtx.drawImage(img, -imageData.width / 2, -imageData.height / 2);
      offscreenCtx.restore();
      
      // Store the transformed image
      const transformedImg = new Image();
      transformedImg.src = offscreenCanvas.toDataURL();
      transformedImg.onload = () => {
        transformedImageRef.current = transformedImg;
        drawCanvas();
      };
    };
    
    offscreenCanvasRef.current = offscreenCanvas;
  }, [imageLoaded, imageData, scale, rotation]);

  // Draw canvas (only overlay and crop box, image is cached)
  const drawCanvas = useCallback(() => {
    if (!imageLoaded || !imageData || !canvasRef.current || !transformedImageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size to match image
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    // Draw cached transformed image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(transformedImageRef.current, 0, 0);
    
    // Draw overlay (darkened area outside crop box)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    // Top
    ctx.fillRect(0, 0, canvas.width, cropBox.y);
    // Bottom
    ctx.fillRect(0, cropBox.y + cropBox.height, canvas.width, canvas.height - cropBox.y - cropBox.height);
    // Left
    ctx.fillRect(0, cropBox.y, cropBox.x, cropBox.height);
    // Right
    ctx.fillRect(cropBox.x + cropBox.width, cropBox.y, canvas.width - cropBox.x - cropBox.width, cropBox.height);
    
    // Draw crop box border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(cropBox.x, cropBox.y, cropBox.width, cropBox.height);
    ctx.setLineDash([]);
    
    // Draw crop box handles
    const handleSize = 12;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    // Corner handles
    const handles = [
      { x: cropBox.x, y: cropBox.y }, // NW
      { x: cropBox.x + cropBox.width, y: cropBox.y }, // NE
      { x: cropBox.x, y: cropBox.y + cropBox.height }, // SW
      { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height }, // SE
    ];
    
    handles.forEach(handle => {
      ctx.fillRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(handle.x - handleSize / 2, handle.y - handleSize / 2, handleSize, handleSize);
    });
    
    // Edge handles
    const edgeHandles = [
      { x: cropBox.x + cropBox.width / 2, y: cropBox.y }, // N
      { x: cropBox.x + cropBox.width / 2, y: cropBox.y + cropBox.height }, // S
      { x: cropBox.x, y: cropBox.y + cropBox.height / 2 }, // W
      { x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height / 2 }, // E
    ];
    
    edgeHandles.forEach(handle => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }, [imageLoaded, imageData, cropBox]);

  // Redraw canvas when crop box changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Check if mouse is on a resize handle
  const getResizeHandle = useCallback((pos: { x: number; y: number }): HandleType => {
    const handleSize = 15;
    const { x, y, width, height } = cropBox;
    
    // Corner handles
    if (Math.abs(pos.x - x) < handleSize && Math.abs(pos.y - y) < handleSize) return 'nw';
    if (Math.abs(pos.x - (x + width)) < handleSize && Math.abs(pos.y - y) < handleSize) return 'ne';
    if (Math.abs(pos.x - x) < handleSize && Math.abs(pos.y - (y + height)) < handleSize) return 'sw';
    if (Math.abs(pos.x - (x + width)) < handleSize && Math.abs(pos.y - (y + height)) < handleSize) return 'se';
    
    // Edge handles
    if (Math.abs(pos.x - (x + width / 2)) < handleSize && Math.abs(pos.y - y) < handleSize) return 'n';
    if (Math.abs(pos.x - (x + width / 2)) < handleSize && Math.abs(pos.y - (y + height)) < handleSize) return 's';
    if (Math.abs(pos.x - x) < handleSize && Math.abs(pos.y - (y + height / 2)) < handleSize) return 'w';
    if (Math.abs(pos.x - (x + width)) < handleSize && Math.abs(pos.y - (y + height / 2)) < handleSize) return 'e';
    
    return null;
  }, [cropBox]);

  // Check if mouse is inside crop box
  const isInsideCropBox = useCallback((pos: { x: number; y: number }): boolean => {
    return pos.x >= cropBox.x && pos.x <= cropBox.x + cropBox.width &&
           pos.y >= cropBox.y && pos.y <= cropBox.y + cropBox.height;
  }, [cropBox]);

  // Handle mouse down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const handle = getResizeHandle(pos);
    
    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setCropStart({ ...cropBox });
    } else if (isInsideCropBox(pos)) {
      setIsDragging(true);
      setDragStart(pos);
      setCropStart({ ...cropBox });
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const handle = getResizeHandle(pos);
    
    // Update cursor
    if (handle) {
      const cursorMap: Record<ResizeHandle, string> = {
        'nw': 'nw-resize',
        'ne': 'ne-resize',
        'sw': 'sw-resize',
        'se': 'se-resize',
        'n': 'n-resize',
        's': 's-resize',
        'e': 'e-resize',
        'w': 'w-resize',
      };
      canvasRef.current!.style.cursor = cursorMap[handle];
    } else if (isInsideCropBox(pos)) {
      canvasRef.current!.style.cursor = 'move';
    } else {
      canvasRef.current!.style.cursor = 'default';
    }
    
    if (isResizing && resizeHandle) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      const minSize = 50;
      
      let newCropBox = { ...cropStart };
      
      switch (resizeHandle) {
        case 'nw':
          newCropBox.x = Math.min(cropStart.x + dx, cropStart.x + cropStart.width - minSize);
          newCropBox.y = Math.min(cropStart.y + dy, cropStart.y + cropStart.height - minSize);
          newCropBox.width = cropStart.width - (newCropBox.x - cropStart.x);
          newCropBox.height = cropStart.height - (newCropBox.y - cropStart.y);
          break;
        case 'ne':
          newCropBox.y = Math.min(cropStart.y + dy, cropStart.y + cropStart.height - minSize);
          newCropBox.width = Math.max(minSize, cropStart.width + dx);
          newCropBox.height = cropStart.height - (newCropBox.y - cropStart.y);
          break;
        case 'sw':
          newCropBox.x = Math.min(cropStart.x + dx, cropStart.x + cropStart.width - minSize);
          newCropBox.width = cropStart.width - (newCropBox.x - cropStart.x);
          newCropBox.height = Math.max(minSize, cropStart.height + dy);
          break;
        case 'se':
          newCropBox.width = Math.max(minSize, cropStart.width + dx);
          newCropBox.height = Math.max(minSize, cropStart.height + dy);
          break;
        case 'n':
          newCropBox.y = Math.min(cropStart.y + dy, cropStart.y + cropStart.height - minSize);
          newCropBox.height = cropStart.height - (newCropBox.y - cropStart.y);
          break;
        case 's':
          newCropBox.height = Math.max(minSize, cropStart.height + dy);
          break;
        case 'e':
          newCropBox.width = Math.max(minSize, cropStart.width + dx);
          break;
        case 'w':
          newCropBox.x = Math.min(cropStart.x + dx, cropStart.x + cropStart.width - minSize);
          newCropBox.width = cropStart.width - (newCropBox.x - cropStart.x);
          break;
      }
      
      // Constrain to image bounds
      if (imageData) {
        newCropBox.x = Math.max(0, newCropBox.x);
        newCropBox.y = Math.max(0, newCropBox.y);
        newCropBox.width = Math.min(imageData.width - newCropBox.x, newCropBox.width);
        newCropBox.height = Math.min(imageData.height - newCropBox.y, newCropBox.height);
      }
      
      setCropBox(newCropBox);
    } else if (isDragging) {
      const dx = pos.x - dragStart.x;
      const dy = pos.y - dragStart.y;
      
      let newCropBox = {
        x: cropStart.x + dx,
        y: cropStart.y + dy,
        width: cropStart.width,
        height: cropStart.height,
      };
      
      // Constrain to image bounds
      if (imageData) {
        newCropBox.x = Math.max(0, Math.min(imageData.width - newCropBox.width, newCropBox.x));
        newCropBox.y = Math.max(0, Math.min(imageData.height - newCropBox.height, newCropBox.y));
      }
      
      setCropBox(newCropBox);
    }
  };

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  // Apply crop
  const handleApplyCrop = () => {
    if (!imageData || !transformedImageRef.current) return;
    
    // Create the final cropped canvas
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    if (!croppedCtx) return;
    
    croppedCanvas.width = cropBox.width;
    croppedCanvas.height = cropBox.height;
    
    // Extract the crop box area from the transformed image
    croppedCtx.drawImage(
      transformedImageRef.current,
      cropBox.x,
      cropBox.y,
      cropBox.width,
      cropBox.height,
      0,
      0,
      cropBox.width,
      cropBox.height
    );
    
    const croppedDataUrl = croppedCanvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedDataUrl);
  };

  // Reset crop
  const handleReset = () => {
    if (!imageData) return;
    
    const initialWidth = imageData.width * 0.8;
    const initialHeight = initialWidth / aspectRatio;
    
    setCropBox({
      x: (imageData.width - initialWidth) / 2,
      y: (imageData.height - initialHeight) / 2,
      width: initialWidth,
      height: initialHeight,
    });
    setScale(1);
    setRotation(0);
  };

  if (!imageLoaded || !imageData) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-gray-500">Loading image...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Crop Image</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
            disabled={scale <= 0.5}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(Math.min(3, scale + 0.1))}
            disabled={scale >= 3}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRotation((rotation + 90) % 360)}
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            Reset
          </Button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="relative bg-gray-900 rounded-lg overflow-hidden"
        style={{ maxHeight: '500px' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="max-w-full h-auto cursor-crosshair"
          style={{
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Crop: {Math.round(cropBox.width)} × {Math.round(cropBox.height)} px
        </div>
        <div>
          Image: {imageData.width} × {imageData.height} px
        </div>
      </div>
      
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={handleApplyCrop}>
          <Check className="w-4 h-4 mr-2" />
          Apply Crop
        </Button>
      </div>
    </div>
  );
}
