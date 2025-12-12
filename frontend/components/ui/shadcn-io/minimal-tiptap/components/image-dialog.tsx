import * as React from "react";
import { Editor } from "@tiptap/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Image as ImageIcon, Crop } from "lucide-react";
import ReactCrop, { Crop as CropType, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageDialogProps {
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageUpload?: (file: File) => Promise<string>;
}

export function ImageDialog({
  editor,
  open,
  onOpenChange,
  onImageUpload,
}: ImageDialogProps) {
  const [imageActiveTab, setImageActiveTab] = React.useState("upload");
  const [imageUrl, setImageUrl] = React.useState("");
  const [imageCaption, setImageCaption] = React.useState("");
  const [uploading, setUploading] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  // Crop state
  const [cropImageSrc, setCropImageSrc] = React.useState<string | null>(null);
  const [crop, setCrop] = React.useState<CropType>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop | null>(null);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [isCropping, setIsCropping] = React.useState(false);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setImageActiveTab("upload");
      setImageCaption("");
      setSelectedFile(null);
      setImageUrl("");
      setCropImageSrc(null);
      setIsCropping(false);
      setCrop(undefined);
      setCompletedCrop(null);
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Read file to show in cropper
      const reader = new FileReader();
      reader.onload = () => {
        setCropImageSrc(reader.result as string);
        setIsCropping(true);
        setSelectedFile(file);
        // Initialize crop to center 80%
        setCrop({
          unit: '%',
          x: 10,
          y: 10,
          width: 80,
          height: 80
        });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const getCroppedImg = (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<File> => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"));
            return;
          }
          const file = new File(
            [blob],
            selectedFile?.name || "cropped-image.png",
            { type: "image/png" }
          );
          resolve(file);
        },
        "image/png",
        1
      );
    });
  };

  const handleCropConfirm = async () => {
    if (!completedCrop || !imgRef.current) {
      // No crop made, just use original
      setIsCropping(false);
      setCropImageSrc(null);
      return;
    }

    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      setSelectedFile(croppedFile);
      setIsCropping(false);
      setCropImageSrc(null);
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Không thể cắt ảnh. Vui lòng thử lại.");
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setCropImageSrc(null);
    setSelectedFile(null);
  };

  const handleInsertImage = async () => {
    if (imageActiveTab === "upload") {
      if (!selectedFile) return;
      if (!onImageUpload) {
        alert("Image upload function not provided");
        return;
      }
      setUploading(true);
      try {
        const url = await onImageUpload(selectedFile);
        editor
          .chain()
          .focus()
          .insertContent({
            type: "imageBlock",
            attrs: { src: url, caption: imageCaption },
          })
          .run();
        onOpenChange(false);
      } catch (error) {
        console.error("Upload failed", error);
        alert("Tải ảnh thất bại");
      } finally {
        setUploading(false);
      }
    } else {
      if (imageUrl) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "imageBlock",
            attrs: { src: imageUrl, caption: imageCaption },
          })
          .run();
        onOpenChange(false);
      }
    }
  };

  return (
    <>
      {/* Crop Dialog */}
      <Dialog open={isCropping} onOpenChange={(open) => !open && handleCropCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Cắt hình ảnh</DialogTitle>
            <DialogDescription>
              Chọn vùng bạn muốn giữ lại. Kéo và thay đổi kích thước khung để cắt ảnh.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-4">
            {cropImageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={undefined}
              >
                <img
                  ref={imgRef}
                  src={cropImageSrc}
                  alt="Crop preview"
                  style={{ maxWidth: "100%", maxHeight: "60vh" }}
                />
              </ReactCrop>
            )}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={handleCropCancel}>
              Hủy
            </Button>
            <Button onClick={handleCropConfirm}>
              <Crop className="mr-2 h-4 w-4" />
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Image Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chèn Hình ảnh</DialogTitle>
            <DialogDescription>
              Tải lên hoặc nhập đường dẫn hình ảnh.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={imageActiveTab}
            onValueChange={setImageActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="upload">Tải lên</TabsTrigger>
              <TabsTrigger value="url">URL</TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition-colors relative h-48">
                {!selectedFile && (
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 z-50 opacity-0 cursor-pointer w-full h-full p-0 border-0"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    title=""
                  />
                )}

                {selectedFile ? (
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md border">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium text-primary line-clamp-1 max-w-[200px]">
                      {selectedFile.name}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setCropImageSrc(reader.result as string);
                            setIsCropping(true);
                            setCrop({
                              unit: '%',
                              x: 10,
                              y: 10,
                              width: 80,
                              height: 80
                            });
                          };
                          reader.readAsDataURL(selectedFile);
                        }}
                      >
                        <Crop className="mr-2 h-4 w-4" />
                        Cắt lại
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground"
                        onClick={() => {
                          setSelectedFile(null);
                        }}
                      >
                        Chọn ảnh khác
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center pointer-events-none">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Nhấp hoặc kéo để chọn ảnh
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ JPG, PNG, GIF
                    </p>
                  </div>
                )}
              </div>

              <div className="grid gap-2 my-4">
                <Label htmlFor="image-caption">Chú thích (Tùy chọn)</Label>
                <Input
                  id="image-caption"
                  placeholder="Nhập chú thích hình ảnh"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleInsertImage}
                  disabled={!selectedFile || uploading}
                >
                  {uploading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Chèn
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="url">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="image-url">URL Hình ảnh</Label>
                  <Input
                    id="image-url"
                    placeholder="https://example.com/image.png"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleInsertImage();
                      }
                    }}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url-caption">Chú thích (Tùy chọn)</Label>
                  <Input
                    id="url-caption"
                    placeholder="Nhập chú thích hình ảnh"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleInsertImage} disabled={!imageUrl}>
                    Chèn
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
