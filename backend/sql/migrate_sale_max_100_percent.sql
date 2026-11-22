-- Mở rộng chiến dịch Sale để hỗ trợ giảm giá 100% (giá thanh toán 0 VND).
ALTER TABLE SALECAMPAIGN
  DROP CHECK ck_sale_percent,
  ADD CONSTRAINT ck_sale_percent CHECK (PercentOff BETWEEN 1 AND 100);
