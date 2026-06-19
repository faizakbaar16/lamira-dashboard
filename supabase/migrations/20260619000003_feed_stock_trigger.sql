-- Trigger to auto-deduct feed stock when duck_daily log is saved
-- Handles INSERT, UPDATE (delta), and DELETE (restore)

CREATE OR REPLACE FUNCTION sync_feed_stock_from_daily_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.feed_type_id IS NOT NULL AND NEW.feed_consumed_kg > 0 THEN
      UPDATE feed_types
        SET current_stock_kg = current_stock_kg - NEW.feed_consumed_kg
        WHERE id = NEW.feed_type_id;
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Restore old
    IF OLD.feed_type_id IS NOT NULL AND OLD.feed_consumed_kg > 0 THEN
      UPDATE feed_types
        SET current_stock_kg = current_stock_kg + OLD.feed_consumed_kg
        WHERE id = OLD.feed_type_id;
    END IF;
    -- Deduct new
    IF NEW.feed_type_id IS NOT NULL AND NEW.feed_consumed_kg > 0 THEN
      UPDATE feed_types
        SET current_stock_kg = current_stock_kg - NEW.feed_consumed_kg
        WHERE id = NEW.feed_type_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.feed_type_id IS NOT NULL AND OLD.feed_consumed_kg > 0 THEN
      UPDATE feed_types
        SET current_stock_kg = current_stock_kg + OLD.feed_consumed_kg
        WHERE id = OLD.feed_type_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS duck_daily_feed_stock_trigger ON duck_daily;

CREATE TRIGGER duck_daily_feed_stock_trigger
AFTER INSERT OR UPDATE OR DELETE ON duck_daily
FOR EACH ROW EXECUTE FUNCTION sync_feed_stock_from_daily_log();
