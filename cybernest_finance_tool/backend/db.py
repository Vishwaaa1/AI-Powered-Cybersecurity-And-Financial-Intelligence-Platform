from sqlalchemy import create_engine, Column, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class VendorMemory(Base):
    __tablename__ = 'vendor_memory'
    vendor = Column(String, primary_key=True)
    category = Column(String)

engine = create_engine("sqlite:///vendor_memory.db")
Base.metadata.create_all(engine)

Session = sessionmaker(bind=engine)
