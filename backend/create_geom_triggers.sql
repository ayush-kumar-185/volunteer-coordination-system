-- SQL Script to add automatic triggers for spatial geom items

-- 1. Needs Table Trigger
CREATE OR REPLACE FUNCTION update_needs_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom = ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS needs_geom_trigger ON needs;

CREATE TRIGGER needs_geom_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude
ON needs
FOR EACH ROW
EXECUTE FUNCTION update_needs_geom();

-- Backfill existing needs
UPDATE needs 
SET geom = ST_MakePoint(longitude, latitude)::geography 
WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;


-- 2. Volunteers Table Trigger
CREATE OR REPLACE FUNCTION update_volunteers_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.geom = ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS volunteers_geom_trigger ON volunteers;

CREATE TRIGGER volunteers_geom_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude
ON volunteers
FOR EACH ROW
EXECUTE FUNCTION update_volunteers_geom();

-- Backfill existing volunteers
UPDATE volunteers 
SET geom = ST_MakePoint(longitude, latitude)::geography 
WHERE geom IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
