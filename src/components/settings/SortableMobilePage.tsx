import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, Copy, Home, MessageSquare, Camera, FileText, User, Bird, Users, Settings, ChevronDown, GripVertical } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MobilePage {
  id: string;
  tabName: string;
  iconUrl: string | null;
  headerLogoUrl: string | null;
  fallbackIcon: string;
  title: string;
  subtitle: string;
  order: number;
  isVisible: boolean;
  isFloating: boolean;
}

interface SortableMobilePageProps {
  page: MobilePage;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<MobilePage>) => void;
  onIconUpload: (file: File) => void;
  onHeaderLogoUpload: (file: File) => void;
  onCopyUrl: (url: string, label: string) => void;
  uploading: string | null;
  IconComponent: LucideIcon;
  iconOptions: Array<{ value: string; label: string; Icon: LucideIcon }>;
}

export function SortableMobilePage({
  page,
  isOpen,
  onToggle,
  onUpdate,
  onIconUpload,
  onHeaderLogoUpload,
  onCopyUrl,
  uploading,
  IconComponent,
  iconOptions,
}: SortableMobilePageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="cursor-grab active:cursor-grabbing"
                    {...attributes}
                    {...listeners}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  {page.iconUrl ? (
                    <img 
                      src={page.iconUrl} 
                      alt={`${page.id} icon`} 
                      className="h-5 w-5 object-contain"
                    />
                  ) : (
                    <IconComponent className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-normal text-muted-foreground">#{page.order}</span>
                    <CardTitle className="text-base capitalize">{page.tabName}</CardTitle>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Label className="text-xs">Floating</Label>
                  <Switch
                    checked={page.isFloating}
                    onCheckedChange={(checked) => onUpdate({ isFloating: checked })}
                  />
                  <Label className="text-xs">Visible</Label>
                  <Switch
                    checked={page.isVisible}
                    onCheckedChange={(checked) => onUpdate({ isVisible: checked })}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tab Name</Label>
                  <Input
                    value={page.tabName}
                    onChange={(e) => onUpdate({ tabName: e.target.value })}
                    placeholder="Tab name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fallback Icon</Label>
                  <Select
                    value={page.fallbackIcon}
                    onValueChange={(value) => onUpdate({ fallbackIcon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(({ value, label, Icon }) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={page.title}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    placeholder="Page title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={page.subtitle}
                    onChange={(e) => onUpdate({ subtitle: e.target.value })}
                    placeholder="Page subtitle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Custom Tab Icon (PNG recommended)</Label>
                <p className="text-xs text-muted-foreground">
                  {page.isFloating ? "For floating tabs, use 48-56px icons" : "For regular tabs, use 24-32px icons"}
                </p>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onIconUpload(file);
                    }}
                    disabled={uploading === `icon-${page.id}`}
                  />
                  {page.iconUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onCopyUrl(page.iconUrl!, "Icon")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {page.iconUrl && (
                  <div className="flex items-center gap-2">
                    <img src={page.iconUrl} alt="Custom icon" className="h-8 w-8 object-contain" />
                    <span className="text-xs text-muted-foreground">Current custom icon</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Custom Header Logo (PNG recommended)</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onHeaderLogoUpload(file);
                    }}
                    disabled={uploading === `header-${page.id}`}
                  />
                  {page.headerLogoUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onCopyUrl(page.headerLogoUrl!, "Header logo")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {page.headerLogoUrl && (
                  <div className="flex items-center gap-2">
                    <img src={page.headerLogoUrl} alt="Custom header logo" className="h-12 object-contain" />
                    <span className="text-xs text-muted-foreground">Current header logo</span>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
