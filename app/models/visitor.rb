class Visitor
  include NonPersistedModel

  attribute :anonymized_name, String, default: nil
  attribute :allowed, Boolean, default: nil
end
