import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, ExternalLink, Map } from "lucide-react";

export default function ShelterMap({ shelter }) {
  const [address, setAddress] = useState(shelter?.address || "");
  const [savedAddress, setSavedAddress] = useState(shelter?.address || "");

  if (!shelter) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-12">
          <Map className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">No shelter selected. Join or create a shelter first.</p>
        </CardContent>
      </Card>
    );
  }

  const encodedAddress = encodeURIComponent(savedAddress || shelter.name);
  const embedUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;
  const mapsUrl = `https://maps.google.com/?q=${encodedAddress}`;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" /> Shelter Location
          </CardTitle>
          <CardDescription>Interactive map of your shelter's location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Address to display on map</Label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => setSavedAddress(address)} disabled={!address.trim()}>
                Update Map
              </Button>
            </div>
          </div>

          {savedAddress ? (
            <div className="rounded-lg overflow-hidden border border-border h-80">
              <iframe
                title="Shelter Map"
                src={embedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border h-80 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Enter an address above to show the map</p>
              </div>
            </div>
          )}

          {savedAddress && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" /> Open in Google Maps
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}