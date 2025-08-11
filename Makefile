build:
	./process.py ./main.template.sh ./main.sh

clean:
	rm -f ./main.sh

.PHONY: run build